-- Grupo 2: Clientes e captação
-- customers, intake_forms, consents
-- Ver docs/schema.md para a explicação em linguagem simples.

-- =========================================================================
-- customers
-- =========================================================================
create table customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  cpf text not null,
  whatsapp text not null,
  email text,
  cep text,
  address_street text,
  address_number text,
  address_complement text,
  address_district text,
  address_city text,
  address_state text,
  notes text,
  tags text[] not null default '{}',
  automation_paused boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, cpf)
);

create index customers_org_id_idx on customers (organization_id);

create trigger customers_set_updated_at
  before update on customers
  for each row execute function set_updated_at();

alter table customers enable row level security;

create policy "customers_select" on customers
  for select using (is_org_member(organization_id));

create policy "customers_insert" on customers
  for insert with check (is_org_member(organization_id));

create policy "customers_update" on customers
  for update using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

create policy "customers_delete" on customers
  for delete using (has_org_role(organization_id, array['owner', 'manager']));

-- =========================================================================
-- intake_forms — cada envio do formulário público /c/[slug]
-- =========================================================================
create table intake_forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  status text not null default 'received' check (status in ('received', 'in_review', 'approved', 'rejected')),
  name text not null,
  cpf text not null,
  whatsapp text not null,
  email text,
  cep text,
  address_street text,
  address_number text,
  address_complement text,
  address_district text,
  address_city text,
  address_state text,
  notes text,
  customer_id uuid references customers(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index intake_forms_org_id_idx on intake_forms (organization_id);

alter table intake_forms enable row level security;

create policy "intake_forms_select" on intake_forms
  for select using (is_org_member(organization_id));

create policy "intake_forms_update" on intake_forms
  for update using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

-- Sem política de INSERT para clientes: quem envia a ficha é um visitante
-- anônimo em /c/[slug]. Essa rota grava pelo servidor (service_role),
-- depois de validar o Cloudflare Turnstile e o limite de envios (Fase 4).

-- =========================================================================
-- consents — prova do aceite da LGPD
-- =========================================================================
create table consents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  intake_form_id uuid references intake_forms(id),
  customer_id uuid references customers(id),
  terms_version text not null,
  accepted_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  constraint consents_target check (intake_form_id is not null or customer_id is not null)
);

create index consents_org_id_idx on consents (organization_id);

alter table consents enable row level security;

create policy "consents_select" on consents
  for select using (is_org_member(organization_id));

-- Sem política de INSERT para clientes, pelo mesmo motivo de intake_forms.
