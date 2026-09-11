-- Camada extra de segurança: além do RLS (que trava LEITURA fora da sua
-- organização), esta migração trava a ESCRITA de referências cruzadas.
-- Exemplo do que isso impede: alguém da organização A criar um contrato
-- com organization_id = A, mas apontando para um customer_id que na
-- verdade pertence à organização B.
--
-- Função genérica e reaproveitável: para cada linha nova/alterada, olha o
-- valor da coluna informada, busca a organização dona da linha referenciada
-- e compara com a organização da própria linha.
--
-- security definer é essencial aqui: sem isso, a checagem roda com a visão
-- de RLS de quem está inserindo, que não enxerga linhas de outra
-- organização — a linha de outra empresa apareceria como "não encontrada"
-- em vez de "encontrada, mas de outra empresa", e o bloqueio nunca
-- disparia.
create or replace function assert_same_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ref_table text := TG_ARGV[0];
  ref_column text := TG_ARGV[1];
  ref_org uuid;
  fk_value uuid;
begin
  execute format('select ($1).%I', ref_column) using new into fk_value;

  if fk_value is null then
    return new;
  end if;

  execute format('select organization_id from %I where id = $1', ref_table)
    using fk_value into ref_org;

  if ref_org is not null and ref_org <> new.organization_id then
    raise exception 'Referência de outra organização não é permitida (%.% -> %)',
      TG_TABLE_NAME, ref_column, ref_table;
  end if;

  return new;
end;
$$;

create trigger contracts_check_customer_org
  before insert or update on contracts
  for each row execute function assert_same_organization('customers', 'customer_id');

create trigger installments_check_contract_org
  before insert or update on installments
  for each row execute function assert_same_organization('contracts', 'contract_id');

create trigger payments_check_installment_org
  before insert or update on payments
  for each row execute function assert_same_organization('installments', 'installment_id');

create trigger intake_forms_check_customer_org
  before insert or update on intake_forms
  for each row execute function assert_same_organization('customers', 'customer_id');

create trigger consents_check_customer_org
  before insert or update on consents
  for each row execute function assert_same_organization('customers', 'customer_id');

create trigger consents_check_intake_form_org
  before insert or update on consents
  for each row execute function assert_same_organization('intake_forms', 'intake_form_id');

create trigger automation_rules_check_template_org
  before insert or update on automation_rules
  for each row execute function assert_same_organization('message_templates', 'template_id');

create trigger message_queue_check_customer_org
  before insert or update on message_queue
  for each row execute function assert_same_organization('customers', 'customer_id');

create trigger message_queue_check_installment_org
  before insert or update on message_queue
  for each row execute function assert_same_organization('installments', 'installment_id');

create trigger message_queue_check_contract_org
  before insert or update on message_queue
  for each row execute function assert_same_organization('contracts', 'contract_id');

create trigger message_queue_check_template_org
  before insert or update on message_queue
  for each row execute function assert_same_organization('message_templates', 'template_id');

create trigger message_queue_check_automation_rule_org
  before insert or update on message_queue
  for each row execute function assert_same_organization('automation_rules', 'automation_rule_id');
