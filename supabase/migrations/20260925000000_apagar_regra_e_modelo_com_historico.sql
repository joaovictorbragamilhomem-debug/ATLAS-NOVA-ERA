-- Deleting an automation rule or a message template failed with a foreign key
-- violation as soon as any message_queue row referenced it, because those FKs
-- had no ON DELETE action. Queue rows are history (they keep rendered_body),
-- so they only lose the link. Messages still waiting to be sent are canceled
-- first, so nothing goes out for a rule or template that no longer exists.
--
-- A template still used by an automation rule stays undeletable on purpose
-- (automation_rules.template_id is untouched): the rule must go first.

alter table message_queue
  drop constraint message_queue_automation_rule_id_fkey,
  add constraint message_queue_automation_rule_id_fkey
    foreign key (automation_rule_id) references automation_rules(id) on delete set null;

alter table message_queue alter column template_id drop not null;

alter table message_queue
  drop constraint message_queue_template_id_fkey,
  add constraint message_queue_template_id_fkey
    foreign key (template_id) references message_templates(id) on delete set null;

-- Runs as the caller, so the message_queue UPDATE policy (org members) applies.
-- If the DELETE itself fails, this UPDATE is rolled back with it.
create or replace function cancel_scheduled_messages_of_deleted_rule()
returns trigger
language plpgsql
as $$
begin
  update message_queue
     set status = 'canceled',
         last_error = 'Regra de cobrança apagada antes do envio.'
   where automation_rule_id = old.id
     and status = 'scheduled';
  return old;
end;
$$;

create trigger automation_rules_cancel_scheduled_messages
  before delete on automation_rules
  for each row execute function cancel_scheduled_messages_of_deleted_rule();

create or replace function cancel_scheduled_messages_of_deleted_template()
returns trigger
language plpgsql
as $$
begin
  update message_queue
     set status = 'canceled',
         last_error = 'Modelo de mensagem apagado antes do envio.'
   where template_id = old.id
     and status = 'scheduled';
  return old;
end;
$$;

create trigger message_templates_cancel_scheduled_messages
  before delete on message_templates
  for each row execute function cancel_scheduled_messages_of_deleted_template();
