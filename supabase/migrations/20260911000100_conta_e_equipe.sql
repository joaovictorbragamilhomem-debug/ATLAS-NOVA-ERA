-- Grupo 1: Conta e equipe
-- organizations, memberships, subscriptions, audit_logs
-- Ver docs/schema.md para a explicação em linguagem simples.

-- =========================================================================
-- organizations
-- =========================================================================
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text,
  phone text,
  pix_key text,
  intake_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_set_updated_at
  before update on organizations
  for each row execute function set_updated_at();

alter table organizations enable row level security;

-- Não existe política de INSERT para organizations: a criação de uma
-- organização acontece no servidor (fluxo de cadastro), usando a chave
-- service_role, que ignora RLS por definição.

-- =========================================================================
-- memberships
-- =========================================================================
create table memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'operator')),
  status text not null default 'active' check (status in ('invited', 'active', 'removed')),
  invited_email text,
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint memberships_user_or_invite check (user_id is not null or invited_email is not null),
  unique (organization_id, user_id)
);

create index memberships_user_id_idx on memberships (user_id);
create index memberships_org_id_idx on memberships (organization_id);

alter table memberships enable row level security;

-- Funções auxiliares para as políticas de segurança (RLS) de todas as
-- próximas tabelas. security definer + search_path fixo evitam tanto
-- recursão infinita de RLS quanto sequestro de esquema.
create or replace function is_org_member(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function has_org_role(org_id uuid, roles text[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any(roles)
  );
$$;

create policy "organizations_select" on organizations
  for select using (is_org_member(id));

create policy "organizations_update" on organizations
  for update using (has_org_role(id, array['owner']))
  with check (has_org_role(id, array['owner']));

create policy "memberships_select" on memberships
  for select using (is_org_member(organization_id));

create policy "memberships_insert" on memberships
  for insert with check (has_org_role(organization_id, array['owner', 'manager']));

create policy "memberships_update" on memberships
  for update using (has_org_role(organization_id, array['owner', 'manager']))
  with check (has_org_role(organization_id, array['owner', 'manager']));

create policy "memberships_delete" on memberships
  for delete using (has_org_role(organization_id, array['owner']));

-- =========================================================================
-- subscriptions — status do pagamento da própria assinatura do ATLAS
-- =========================================================================
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  asaas_customer_id text,
  asaas_subscription_id text,
  asaas_payment_id text,
  plan text not null check (plan in ('monthly', 'annual', 'lifetime')),
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled', 'lifetime')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_set_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

alter table subscriptions enable row level security;

create policy "subscriptions_select" on subscriptions
  for select using (is_org_member(organization_id));

-- Sem política de INSERT/UPDATE para clientes: quem grava aqui é o
-- webhook do Asaas e o painel do dono da plataforma, ambos no servidor.

-- =========================================================================
-- audit_logs — trilha de auditoria, nunca apagada
-- =========================================================================
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_org_id_idx on audit_logs (organization_id);
create index audit_logs_entity_idx on audit_logs (entity_type, entity_id);

alter table audit_logs enable row level security;

create policy "audit_logs_select" on audit_logs
  for select using (is_org_member(organization_id));

-- Sem política de INSERT para clientes: os registros de auditoria são
-- gravados pelo servidor (service_role) para não poderem ser adulterados.
