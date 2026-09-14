-- Grupo 4 (extensão): Central de conversas
-- whatsapp_messages — mensagens de WhatsApp trocadas com o cliente
-- (recebidas pelo webhook e respostas enviadas pelo time), separado da
-- fila de cobrança automática (message_queue).
-- Ver docs/schema.md para a explicação em linguagem simples.

create table whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  -- DDD + número do lado do cliente, sem "55"/"+" na frente — guardado à
  -- parte porque uma mensagem pode chegar de um número sem cliente
  -- cadastrado ainda (customer_id fica nulo nesse caso).
  customer_phone_digits text not null,
  -- id da mensagem na Meta ("wamid..."), usado como trava de idempotência
  -- — a Meta reenvia entregas de webhook, isso evita duplicar.
  provider_message_id text not null unique,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index whatsapp_messages_org_customer_idx on whatsapp_messages (organization_id, customer_id, occurred_at);
create index whatsapp_messages_org_occurred_idx on whatsapp_messages (organization_id, occurred_at desc);

alter table whatsapp_messages enable row level security;

create policy "whatsapp_messages_select" on whatsapp_messages
  for select using (is_org_member(organization_id));

-- Mensagem "inbound" só chega pelo webhook (via service_role, que ignora
-- RLS) — um membro da organização só pode gravar a própria resposta
-- (outbound), nunca forjar uma mensagem "recebida".
create policy "whatsapp_messages_insert_outbound_only" on whatsapp_messages
  for insert with check (direction = 'outbound' and is_org_member(organization_id));

-- Sem política de UPDATE/DELETE: mensagem é imutável depois de registrada.
