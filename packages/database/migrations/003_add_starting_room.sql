alter table games
add column starting_room_id uuid;

alter table games
add constraint games_starting_room_fk
foreign key (id, starting_room_id)
references entities (game_id, id)
on delete set null (starting_room_id);

create function validate_game_starting_room_kind()
returns trigger
language plpgsql
as $$
begin
  if new.starting_room_id is not null then
    perform require_entity_kind(
      new.starting_room_id,
      'room',
      'starting_room_id'
    );
  end if;

  return new;
end;
$$;

create trigger games_validate_starting_room_kind
before insert or update of starting_room_id on games
for each row
execute function validate_game_starting_room_kind();