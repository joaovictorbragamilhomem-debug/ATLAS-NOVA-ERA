-- Garante que o mesmo evento de webhook da Asaas nunca seja processado
-- duas vezes: a chave primária é o próprio id do evento, então uma
-- segunda tentativa de inserir o mesmo id falha (e o webhook trata isso
-- como "já processado", sem duplicar nada).
create table asaas_webhook_events (
  id text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);

alter table asaas_webhook_events enable row level security;

-- Ninguém além do servidor (service_role) lê ou escreve aqui — não há
-- política nenhuma de propósito, isso é só um registro técnico interno.

-- CPF ou CNPJ usado para cobrar a assinatura na Asaas (obrigatório por
-- ela). É diferente do "cnpj" da organização, que pode nem existir ainda
-- (ex.: pessoa física operando sozinha).
alter table organizations add column billing_document text;
