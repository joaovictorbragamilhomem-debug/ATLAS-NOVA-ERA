-- Collections assistant (AI): answers the store's customers on WhatsApp on
-- the store's behalf (resends the Pix, notes payment promises, hands over to
-- a person when needed). Off by default — the owner turns it on in
-- WhatsApp settings. See docs/schema.md.

alter table organizations
  add column assistant_enabled boolean not null default false;

-- Set when the customer asks to stop receiving WhatsApp messages. While set,
-- automatic messages to them are canceled (WhatsApp policy requires honoring
-- opt-outs). The store can clear it if the customer asks to come back.
alter table customers
  add column whatsapp_opted_out_at timestamptz;

-- Tells the assistant's replies apart from replies typed by the team.
alter table whatsapp_messages
  add column sent_by_assistant boolean not null default false;

-- =========================================================================
-- assistant_runs — one row per customer message the assistant handled:
-- idempotency lock (Meta redelivers webhooks), audit trail, token usage.
-- =========================================================================
create table assistant_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  inbound_message_id uuid not null unique references whatsapp_messages(id) on delete cascade,
  status text not null default 'processing' check (status in ('processing', 'replied', 'skipped', 'failed')),
  action text,
  detail text,
  reply_message_id uuid references whatsapp_messages(id) on delete set null,
  input_tokens int,
  output_tokens int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assistant_runs_org_customer_idx on assistant_runs (organization_id, customer_id, created_at desc);

create trigger assistant_runs_set_updated_at
  before update on assistant_runs
  for each row execute function set_updated_at();

alter table assistant_runs enable row level security;

create policy "assistant_runs_select" on assistant_runs
  for select using (is_org_member(organization_id));

-- =========================================================================
-- assistant_alerts — what only a person at the store can handle ("já
-- paguei", requests the assistant can't grant, opt-outs). While an alert is
-- open the assistant stays quiet in that conversation; a reply typed by the
-- team (or "Resolvido") closes it.
-- =========================================================================
create table assistant_alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  run_id uuid references assistant_runs(id) on delete set null,
  kind text not null check (kind in ('paid_claim', 'needs_human', 'opt_out')),
  reason text not null,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index assistant_alerts_open_idx on assistant_alerts (organization_id, customer_id) where resolved_at is null;

alter table assistant_alerts enable row level security;

create policy "assistant_alerts_select" on assistant_alerts
  for select using (is_org_member(organization_id));

-- =========================================================================
-- payment_promises — "pago na sexta": the regular overdue reminders for that
-- installment pause until the promised date, and one reminder goes out on
-- the day.
-- =========================================================================
create table payment_promises (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  installment_id uuid not null references installments(id) on delete cascade,
  promised_date date not null,
  status text not null default 'open' check (status in ('open', 'reminded', 'canceled')),
  run_id uuid references assistant_runs(id) on delete set null,
  created_at timestamptz not null default now()
);

create index payment_promises_open_idx on payment_promises (promised_date) where status = 'open';
create index payment_promises_installment_idx on payment_promises (installment_id) where status = 'open';

alter table payment_promises enable row level security;

create policy "payment_promises_select" on payment_promises
  for select using (is_org_member(organization_id));

-- Writes to these tables only happen on the server with the service role
-- (webhook, cron, owner actions checked in code) — no insert/update policies.
