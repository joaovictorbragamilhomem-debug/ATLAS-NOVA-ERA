-- Grupo 3: Contratos e dinheiro
-- contracts, installments, payments
-- Ver docs/schema.md para a explicação em linguagem simples.
-- Tudo em centavos (bigint), nunca número decimal solto.

-- =========================================================================
-- contracts
-- =========================================================================
create table contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid not null references customers(id),
  principal_amount_cents bigint not null check (principal_amount_cents > 0),
  installments_count int not null check (installments_count > 0),
  periodicity text not null check (periodicity in ('weekly', 'biweekly', 'monthly')),
  first_due_date date not null,
  installment_amount_cents bigint not null check (installment_amount_cents > 0),
  late_fee_percent numeric(5, 2) not null default 0,
  late_interest_monthly_percent numeric(6, 4) not null default 0,
  status text not null default 'active' check (status in ('active', 'completed', 'renegotiated', 'canceled')),
  renegotiated_from_contract_id uuid references contracts(id),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contracts_org_id_idx on contracts (organization_id);
create index contracts_customer_id_idx on contracts (customer_id);

create trigger contracts_set_updated_at
  before update on contracts
  for each row execute function set_updated_at();

alter table contracts enable row level security;

create policy "contracts_select" on contracts
  for select using (is_org_member(organization_id));

-- Criar/editar contrato é uma decisão de crédito: fica restrito a
-- gestor/dono, mesmo que o operador consiga ver e trabalhar os contratos
-- existentes (dar baixa, etc.).
create policy "contracts_insert" on contracts
  for insert with check (has_org_role(organization_id, array['owner', 'manager']));

create policy "contracts_update" on contracts
  for update using (has_org_role(organization_id, array['owner', 'manager']))
  with check (has_org_role(organization_id, array['owner', 'manager']));

-- =========================================================================
-- installments
-- =========================================================================
create table installments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  number int not null check (number > 0),
  due_date date not null,
  amount_cents bigint not null check (amount_cents > 0),
  status text not null default 'pending' check (status in ('pending', 'partially_paid', 'paid', 'renegotiated', 'reversed')),
  paid_amount_cents bigint not null default 0 check (paid_amount_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contract_id, number)
);

create index installments_org_id_idx on installments (organization_id);
create index installments_contract_id_idx on installments (contract_id);
create index installments_due_date_idx on installments (due_date);

create trigger installments_set_updated_at
  before update on installments
  for each row execute function set_updated_at();

alter table installments enable row level security;

create policy "installments_select" on installments
  for select using (is_org_member(organization_id));

-- As parcelas nascem junto com o contrato (mesma regra: gestor/dono).
create policy "installments_insert" on installments
  for insert with check (has_org_role(organization_id, array['owner', 'manager']));

-- Qualquer membro ativo pode dar baixa em pagamento (inclusive operador).
-- Estornar/renegociar uma parcela é bloqueado abaixo por um gatilho,
-- mesmo que essa política de UPDATE seja ampla.
create policy "installments_update" on installments
  for update using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

-- O RLS acima não diferencia "dar baixa" de "estornar/renegociar" porque o
-- Postgres não compara valor antigo x novo dentro de uma política de forma
-- simples. Um gatilho (trigger) cobre exatamente essa lacuna de segurança.
create or replace function guard_installment_status_change()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('reversed', 'renegotiated') and old.status not in ('reversed', 'renegotiated') then
    if not has_org_role(new.organization_id, array['owner', 'manager']) then
      raise exception 'Somente owner ou manager podem estornar ou renegociar uma parcela';
    end if;
  end if;
  return new;
end;
$$;

create trigger installments_guard_status_change
  before update on installments
  for each row execute function guard_installment_status_change();

-- =========================================================================
-- payments — extrato de baixas (inclusive parciais) de cada parcela
-- =========================================================================
create table payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  installment_id uuid not null references installments(id) on delete cascade,
  amount_cents bigint not null check (amount_cents > 0),
  paid_at timestamptz not null default now(),
  method text not null check (method in ('pix', 'dinheiro', 'transferencia', 'cartao')),
  reversed_at timestamptz,
  reversed_reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index payments_org_id_idx on payments (organization_id);
create index payments_installment_id_idx on payments (installment_id);

alter table payments enable row level security;

create policy "payments_select" on payments
  for select using (is_org_member(organization_id));

create policy "payments_insert" on payments
  for insert with check (is_org_member(organization_id));

create policy "payments_update" on payments
  for update using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

-- Mesma lógica do gatilho de parcelas: estornar um pagamento é restrito
-- a gestor/dono.
create or replace function guard_payment_reversal()
returns trigger
language plpgsql
as $$
begin
  if new.reversed_at is not null and old.reversed_at is null then
    if not has_org_role(new.organization_id, array['owner', 'manager']) then
      raise exception 'Somente owner ou manager podem estornar um pagamento';
    end if;
  end if;
  return new;
end;
$$;

create trigger payments_guard_reversal
  before update on payments
  for each row execute function guard_payment_reversal();
