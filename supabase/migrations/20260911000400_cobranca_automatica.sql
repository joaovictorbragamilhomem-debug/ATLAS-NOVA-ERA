-- Grupo 4: Cobrança automática pelo WhatsApp
-- message_templates, automation_rules, message_queue, message_logs,
-- whatsapp_connections
-- Ver docs/schema.md para a explicação em linguagem simples.

-- =========================================================================
-- message_templates
-- =========================================================================
create table message_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index message_templates_org_id_idx on message_templates (organization_id);

create trigger message_templates_set_updated_at
  before update on message_templates
  for each row execute function set_updated_at();

alter table message_templates enable row level security;

create policy "message_templates_select" on message_templates
  for select using (is_org_member(organization_id));

create policy "message_templates_insert" on message_templates
  for insert with check (has_org_role(organization_id, array['owner', 'manager']));

create policy "message_templates_update" on message_templates
  for update using (has_org_role(organization_id, array['owner', 'manager']))
  with check (has_org_role(organization_id, array['owner', 'manager']));

create policy "message_templates_delete" on message_templates
  for delete using (has_org_role(organization_id, array['owner', 'manager']));

-- =========================================================================
-- automation_rules — os gatilhos que ligam/desligam, cada um com horário
-- =========================================================================
create table automation_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  trigger_type text not null check (trigger_type in (
    'reminder_before', 'due_today', 'overdue_after',
    'renegotiation_offer', 'payment_confirmation', 'contract_created'
  )),
  days_offset int,
  template_id uuid not null references message_templates(id),
  active boolean not null default true,
  send_window_start time not null default '08:00',
  send_window_end time not null default '20:00',
  skip_sunday boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, trigger_type, days_offset)
);

create index automation_rules_org_id_idx on automation_rules (organization_id);

create trigger automation_rules_set_updated_at
  before update on automation_rules
  for each row execute function set_updated_at();

alter table automation_rules enable row level security;

create policy "automation_rules_select" on automation_rules
  for select using (is_org_member(organization_id));

create policy "automation_rules_insert" on automation_rules
  for insert with check (has_org_role(organization_id, array['owner', 'manager']));

create policy "automation_rules_update" on automation_rules
  for update using (has_org_role(organization_id, array['owner', 'manager']))
  with check (has_org_role(organization_id, array['owner', 'manager']));

create policy "automation_rules_delete" on automation_rules
  for delete using (has_org_role(organization_id, array['owner', 'manager']));

-- =========================================================================
-- message_queue — a fila: o que está agendado para ser enviado
-- =========================================================================
create table message_queue (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid not null references customers(id),
  installment_id uuid references installments(id),
  contract_id uuid references contracts(id),
  automation_rule_id uuid references automation_rules(id),
  template_id uuid not null references message_templates(id),
  trigger_type text not null,
  scheduled_for timestamptz not null,
  -- Dia (no fuso America/Sao_Paulo) do envio agendado. Preenchido sozinho
  -- por gatilho — existe para permitir a trava de "não cobrar 2x" abaixo,
  -- já que um índice não pode usar diretamente uma expressão que dependa
  -- de fuso horário.
  scheduled_date date,
  rendered_body text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'sent', 'delivered', 'read', 'failed', 'canceled')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index message_queue_org_id_idx on message_queue (organization_id);
create index message_queue_scheduled_for_idx on message_queue (scheduled_for) where status = 'scheduled';

create or replace function set_message_queue_scheduled_date()
returns trigger
language plpgsql
as $$
begin
  new.scheduled_date := (new.scheduled_for at time zone 'America/Sao_Paulo')::date;
  return new;
end;
$$;

create trigger message_queue_set_scheduled_date
  before insert or update of scheduled_for on message_queue
  for each row execute function set_message_queue_scheduled_date();

-- Trava contra cobrança em dobro: a mesma parcela não pode receber o
-- mesmo tipo de gatilho duas vezes no mesmo dia agendado. Isso é uma
-- restrição do próprio banco, não depende do código lembrar de checar.
create unique index message_queue_no_duplicate_idx
  on message_queue (installment_id, trigger_type, scheduled_date)
  where installment_id is not null;

create trigger message_queue_set_updated_at
  before update on message_queue
  for each row execute function set_updated_at();

alter table message_queue enable row level security;

create policy "message_queue_select" on message_queue
  for select using (is_org_member(organization_id));

create policy "message_queue_update" on message_queue
  for update using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

-- Sem política de INSERT para clientes: quem enfileira mensagens é a
-- rotina do cron (Fase 5), rodando no servidor com service_role.

-- =========================================================================
-- message_logs — uma linha por mudança de status de uma mensagem
-- =========================================================================
create table message_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  queue_id uuid not null references message_queue(id) on delete cascade,
  status text not null check (status in ('scheduled', 'sent', 'delivered', 'read', 'failed')),
  provider_message_id text,
  error text,
  occurred_at timestamptz not null default now()
);

create index message_logs_org_id_idx on message_logs (organization_id);
create index message_logs_queue_id_idx on message_logs (queue_id);

alter table message_logs enable row level security;

create policy "message_logs_select" on message_logs
  for select using (is_org_member(organization_id));

-- Sem política de INSERT para clientes: gravado pelo servidor
-- (webhook do provedor de WhatsApp e/ou pela rotina de envio).

-- =========================================================================
-- whatsapp_connections
-- =========================================================================
create table whatsapp_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  provider text not null check (provider in ('meta_cloud_api', 'qrcode')),
  status text not null default 'disconnected' check (status in ('disconnected', 'connecting', 'connected', 'error')),
  phone_number text,
  provider_account_id text,
  credentials_ref text,
  connected_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger whatsapp_connections_set_updated_at
  before update on whatsapp_connections
  for each row execute function set_updated_at();

alter table whatsapp_connections enable row level security;

create policy "whatsapp_connections_select" on whatsapp_connections
  for select using (is_org_member(organization_id));

-- Conexão do WhatsApp é coisa de Dono, conforme o seu briefing de papéis.
create policy "whatsapp_connections_insert" on whatsapp_connections
  for insert with check (has_org_role(organization_id, array['owner']));

create policy "whatsapp_connections_update" on whatsapp_connections
  for update using (has_org_role(organization_id, array['owner']))
  with check (has_org_role(organization_id, array['owner']));
