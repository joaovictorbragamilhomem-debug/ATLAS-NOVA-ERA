-- Grupo 1 (extensão): cidade da organização, usada no código de pagamento
-- Pix "Copia e Cola" (BR Code) que passa a ir junto das mensagens de
-- cobrança — o padrão do Banco Central exige um campo "cidade do
-- recebedor" nesse código. Ver docs/schema.md.

alter table organizations
  add column pix_city text;
