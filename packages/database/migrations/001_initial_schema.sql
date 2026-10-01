create extension if not exists pgcrypto;

create type entity_kind as enum ('room', 'object', 'fixture');
create type placement_relation as enum ('in', 'on');

create table games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table entities (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  description text,
  kind entity_kind not null,
  properties jsonb not null default '{}'::jsonb
    check (jsonb_typeof(properties) = 'object'),
  initial_state jsonb not null default '{}'::jsonb
    check (jsonb_typeof(initial_state) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, slug),
  unique (game_id, id)
);

create table placements (
  game_id uuid not null references games(id) on delete cascade,
  entity_id uuid primary key,
  target_id uuid not null,
  relation placement_relation not null,
  foreign key (game_id, entity_id)
    references entities(game_id, id) on delete cascade,
  foreign key (game_id, target_id)
    references entities(game_id, id) on delete cascade,
  check (entity_id <> target_id)
);

create table connections (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  from_room_id uuid not null,
  to_room_id uuid not null,
  direction text not null check (btrim(direction) <> ''),
  reverse_direction text not null check (btrim(reverse_direction) <> ''),
  portal_entity_id uuid,
  foreign key (game_id, from_room_id)
    references entities(game_id, id) on delete cascade,
  foreign key (game_id, to_room_id)
    references entities(game_id, id) on delete cascade,
  foreign key (game_id, portal_entity_id)
    references entities(game_id, id) on delete set null (portal_entity_id),
  unique (game_id, slug),
  unique (game_id, from_room_id, direction),
  check (from_room_id <> to_room_id)
);

create table unlocks (
  game_id uuid not null references games(id) on delete cascade,
  key_entity_id uuid not null,
  lock_entity_id uuid not null,
  foreign key (game_id, key_entity_id)
    references entities(game_id, id) on delete cascade,
  foreign key (game_id, lock_entity_id)
    references entities(game_id, id) on delete cascade,
  primary key (key_entity_id, lock_entity_id),
  check (key_entity_id <> lock_entity_id)
);

create table playthroughs (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  current_room_id uuid not null,
  resume_token_hash text not null unique check (btrim(resume_token_hash) <> ''),
  world_state jsonb not null default '{}'::jsonb
    check (jsonb_typeof(world_state) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, id),
  foreign key (game_id, current_room_id)
    references entities(game_id, id)
);

create table entity_state (
  game_id uuid not null,
  playthrough_id uuid not null,
  entity_id uuid not null,
  state jsonb not null default '{}'::jsonb
    check (jsonb_typeof(state) = 'object'),
  foreign key (game_id, playthrough_id)
    references playthroughs(game_id, id) on delete cascade,
  foreign key (game_id, entity_id)
    references entities(game_id, id) on delete cascade,
  primary key (playthrough_id, entity_id)
);

create table placement_state (
  game_id uuid not null,
  playthrough_id uuid not null,
  entity_id uuid not null,
  target_id uuid,
  relation placement_relation,
  in_inventory boolean not null default false,
  foreign key (game_id, playthrough_id)
    references playthroughs(game_id, id) on delete cascade,
  foreign key (game_id, entity_id)
    references entities(game_id, id) on delete cascade,
  foreign key (game_id, target_id)
    references entities(game_id, id) on delete cascade,
  primary key (playthrough_id, entity_id),
  check (entity_id <> target_id),
  check (
    (in_inventory and target_id is null and relation is null)
    or
    (not in_inventory and target_id is not null and relation is not null)
  )
);

create index entities_game_kind_idx on entities (game_id, kind);
create index placements_target_idx on placements (target_id);
create index connections_to_room_idx on connections (to_room_id);
create index connections_portal_idx on connections (portal_entity_id)
  where portal_entity_id is not null;
create index unlocks_lock_idx on unlocks (lock_entity_id);
create index entity_state_entity_idx on entity_state (entity_id);
create index placement_state_target_idx on placement_state (target_id)
  where target_id is not null;

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger games_set_updated_at
before update on games
for each row execute function set_updated_at();

create trigger entities_set_updated_at
before update on entities
for each row execute function set_updated_at();

create trigger playthroughs_set_updated_at
before update on playthroughs
for each row execute function set_updated_at();
