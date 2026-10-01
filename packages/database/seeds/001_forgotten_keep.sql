-- This seed owns only the demo game. Deleting it cascades to all of its data,
-- which makes this file safe to rerun without duplicating rows.
delete from games where slug = 'forgotten-keep';

insert into games (id, slug, name, description)
values (
  '10000000-0000-0000-0000-000000000001',
  'forgotten-keep',
  'The Forgotten Keep',
  'A compact demo world for exercising the MCP Adventure data model.'
);

insert into entities (
  id, game_id, slug, name, description, kind, properties, initial_state
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'throne-room', 'Throne Room',
    'A faded throne faces tall doors and a scarred oak table.',
    'room', '{"naturallyLit": true}', '{}'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'west-hall', 'West Hall',
    'A narrow hall ends at a red iron door.',
    'room', '{"naturallyLit": true}', '{}'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'dungeon', 'Dungeon',
    'Cold stone steps descend into a lightless chamber.',
    'room', '{"naturallyLit": false}', '{}'
  ),
  (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'oak-table', 'oak table',
    'A heavy table whose surface is marked by age.',
    'fixture', '{"surface": true}', '{}'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'iron-chest', 'iron chest',
    'A small iron-bound chest rests on the table.',
    'object',
    '{"container": true, "surface": true, "openable": true, "lockable": true}',
    '{"open": false, "locked": false}'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'brass-lantern', 'brass lantern',
    'A dented lantern with a serviceable wick.',
    'object',
    '{"portable": true, "lightSource": true, "switchable": true}',
    '{"on": false}'
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'blue-key', 'blue key',
    'A small key painted an improbable shade of blue.',
    'object', '{"portable": true}', '{}'
  ),
  (
    '30000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000001',
    'red-door', 'red door',
    'A red iron door blocks the northern end of the hall.',
    'fixture', '{"openable": true, "lockable": true}',
    '{"open": false, "locked": true}'
  ),
  (
    '30000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000001',
    'stone-pedestal', 'stone pedestal',
    'A waist-high pedestal stands in the dungeon.',
    'fixture', '{"surface": true}', '{}'
  ),
  (
    '30000000-0000-0000-0000-000000000007',
    '10000000-0000-0000-0000-000000000001',
    'silver-amulet', 'silver amulet',
    'A silver amulet set with a dark green stone.',
    'object', '{"portable": true}', '{}'
  ),
  (
    '30000000-0000-0000-0000-000000000008',
    '10000000-0000-0000-0000-000000000001',
    'rusty-sword', 'rusty sword',
    'A rusty sword with an image of a demon etched into it.',
    'object', '{"portable": true}', '{}'
  );

update games
set starting_room_id =
  '20000000-0000-0000-0000-000000000001'
where id =
  '10000000-0000-0000-0000-000000000001';

insert into placements (game_id, entity_id, target_id, relation)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001', 'in'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001', 'on'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000002', 'in'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000001', 'in'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000006',
    '20000000-0000-0000-0000-000000000003', 'in'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000008',
    '20000000-0000-0000-0000-000000000002', 'in'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000007',
    '30000000-0000-0000-0000-000000000006', 'on'
  );

insert into connections (
  id, game_id, slug, from_room_id, to_room_id,
  direction, reverse_direction, portal_entity_id
)
values
  (
    '40000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'throne-room-to-west-hall',
    '20000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'west', 'east', null
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'west-hall-to-dungeon',
    '20000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000003',
    'north', 'south',
    '30000000-0000-0000-0000-000000000005'
  );

insert into unlocks (game_id, key_entity_id, lock_entity_id)
values (
  '10000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000004',
  '30000000-0000-0000-0000-000000000005'
);

