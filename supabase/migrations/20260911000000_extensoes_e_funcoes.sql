-- Extensões e funções utilitárias usadas pelo resto das migrações.

create extension if not exists pgcrypto;

-- Mantém a coluna updated_at sempre atualizada quando a linha muda.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
