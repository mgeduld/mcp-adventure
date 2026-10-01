create function require_entity_kind(
  checked_entity_id uuid,
  expected_kind entity_kind,
  context_label text
)
returns void
language plpgsql
as $$
declare
  actual_kind entity_kind;
begin
  select kind into actual_kind from entities where id = checked_entity_id;
  if actual_kind is distinct from expected_kind then
    raise exception '% must reference an entity of kind %, but found %',
      context_label, expected_kind, actual_kind;
  end if;
end;
$$;

create function validate_connection_entity_kinds()
returns trigger
language plpgsql
as $$
begin
  perform require_entity_kind(new.from_room_id, 'room', 'from_room_id');
  perform require_entity_kind(new.to_room_id, 'room', 'to_room_id');
  return new;
end;
$$;

create trigger connections_validate_entity_kinds
before insert or update on connections
for each row execute function validate_connection_entity_kinds();

create function validate_playthrough_room_kind()
returns trigger
language plpgsql
as $$
begin
  perform require_entity_kind(new.current_room_id, 'room', 'current_room_id');
  return new;
end;
$$;

create trigger playthroughs_validate_room_kind
before insert or update on playthroughs
for each row execute function validate_playthrough_room_kind();

create function prevent_authored_placement_cycle()
returns trigger
language plpgsql
as $$
declare
  creates_cycle boolean;
begin
  with recursive ancestors(id) as (
    select new.target_id
    union
    select p.target_id
    from placements p
    join ancestors a on p.entity_id = a.id
    where p.entity_id <> new.entity_id
  )
  select exists(select 1 from ancestors where id = new.entity_id)
  into creates_cycle;

  if creates_cycle then
    raise exception 'Placement would create a cycle for entity %', new.entity_id;
  end if;
  return new;
end;
$$;

create trigger placements_prevent_cycle
before insert or update on placements
for each row execute function prevent_authored_placement_cycle();

