-- Fase 5: a API oficial da Meta só manda mensagem "por iniciativa da
-- empresa" (fora de uma janela de 24h de conversa) se for um modelo já
-- aprovado pelo próprio WhatsApp — não dá para mandar texto livre direto.
-- Por isso cada modelo nosso (message_templates) também guarda o nome do
-- modelo espelhado e aprovado no Gerenciador do WhatsApp Business.
alter table message_templates
  add column meta_template_name text,
  add column meta_template_language text not null default 'pt_BR';
