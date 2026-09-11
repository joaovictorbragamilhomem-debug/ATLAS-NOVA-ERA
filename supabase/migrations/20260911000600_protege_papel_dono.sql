-- A política de RLS de memberships (Fase 0) libera update de papel para
-- owner OU manager, sem diferenciar QUAL papel está sendo definido. Isso
-- deixa uma brecha: um gestor poderia trocar o próprio papel para "owner"
-- (ou rebaixar o dono de verdade). Este gatilho fecha essa brecha.
create or replace function guard_owner_role_change()
returns trigger
language plpgsql
as $$
begin
  if (new.role = 'owner' or old.role = 'owner')
     and not has_org_role(new.organization_id, array['owner']) then
    raise exception 'Somente o dono da conta pode conceder ou alterar o papel de dono';
  end if;
  return new;
end;
$$;

create trigger memberships_guard_owner_role_change
  before update on memberships
  for each row execute function guard_owner_role_change();

-- Mesma ideia para o convite: só o dono pode convidar alguém já como dono.
-- Exceção: a primeira linha de uma organização nova (o próprio cadastro,
-- que roda com o cliente admin, sem nenhum usuário logado ainda) — aí não
-- existe dono nenhum ainda para "ser dono" de verdade.
create or replace function guard_owner_role_insert()
returns trigger
language plpgsql
as $$
declare
  has_existing_owner boolean;
begin
  if new.role <> 'owner' then
    return new;
  end if;

  select exists (
    select 1 from memberships
    where organization_id = new.organization_id and role = 'owner'
  ) into has_existing_owner;

  if has_existing_owner and not has_org_role(new.organization_id, array['owner']) then
    raise exception 'Somente o dono da conta pode convidar outro dono';
  end if;

  return new;
end;
$$;

create trigger memberships_guard_owner_role_insert
  before insert on memberships
  for each row execute function guard_owner_role_insert();
