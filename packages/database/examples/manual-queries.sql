-- List the demo world's entities.
select e.slug, e.name, e.kind, e.properties, e.initial_state
from entities e
join games g on g.id = e.game_id
where g.slug = 'forgotten-keep'
order by e.kind, e.slug;

-- Read every authored placement in plain language.
select
  child.name as entity,
  upper(p.relation::text) as relation,
  parent.name as target
from placements p
join entities child on child.id = p.entity_id
join entities parent on parent.id = p.target_id
join games g on g.id = p.game_id
where g.slug = 'forgotten-keep'
order by parent.name, child.name;

-- Follow the brass lantern outward through nested placement.
with recursive location_chain as (
  select
    child.id,
    child.name,
    p.relation,
    parent.id as target_id,
    parent.name as target_name,
    1 as depth
  from entities child
  join placements p on p.entity_id = child.id
  join entities parent on parent.id = p.target_id
  where child.slug = 'brass-lantern'

  union all

  select
    parent.id,
    parent.name,
    p.relation,
    grandparent.id,
    grandparent.name,
    chain.depth + 1
  from location_chain chain
  join entities parent on parent.id = chain.target_id
  join placements p on p.entity_id = parent.id
  join entities grandparent on grandparent.id = p.target_id
)
select name, upper(relation::text) as relation, target_name, depth
from location_chain
order by depth;

-- Show room connections and any stateful portal that controls traversal.
select
  origin.name as from_room,
  c.direction,
  destination.name as to_room,
  portal.name as portal,
  portal.initial_state as portal_initial_state
from connections c
join entities origin on origin.id = c.from_room_id
join entities destination on destination.id = c.to_room_id
left join entities portal on portal.id = c.portal_entity_id
order by origin.name, c.direction;

-- Show which key unlocks which entity.
select key.name as key, lock.name as unlocks
from unlocks u
join entities key on key.id = u.key_entity_id
join entities lock on lock.id = u.lock_entity_id;

