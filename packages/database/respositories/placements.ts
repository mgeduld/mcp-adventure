import type { Pool, PoolClient } from "pg";
import { db } from "../src/db.js";

type Queryable = Pool | PoolClient;

export type PlacementRelation = "in" | "on";

type PlacementRow = {
  game_id: string;
  entity_id: string;
  target_id: string;
  relation: PlacementRelation;
};

export type Placement = {
  gameId: string;
  entityId: string;
  targetId: string;
  relation: PlacementRelation;
};

export async function getPlacementByEntityId(
  gameId: string,
  entityId: string,
  queryable: Queryable = db,
): Promise<Placement | null> {
  const result = await queryable.query<PlacementRow>(
    `
      select
        game_id,
        entity_id,
        target_id,
        relation
      from placements
      where game_id = $1 and entity_id = $2
    `,
    [gameId, entityId],
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    gameId: row.game_id,
    entityId: row.entity_id,
    targetId: row.target_id,
    relation: row.relation,
  };
}

// finds direct children of a room, table, or container while respecting playthrough overrides.
// An inventory’s null target means “in inventory,” not “fall back to the authored target.”
export async function getCurrentPlacementsByTarget(
  playthroughId: string,
  targetId: string,
  queryable: Queryable = db,
): Promise<Placement[]> {
  const result = await queryable.query<PlacementRow>(
    `
      select
        p.game_id,
        p.entity_id,
        p.target_id,
        p.relation
      from playthroughs pt
      join placements p on p.game_id = pt.game_id
      where pt.id = $1
        and p.target_id = $2
        and not exists (
          select 1
          from placement_state ps
          where ps.playthrough_id = pt.id
            and ps.entity_id = p.entity_id
        )

      union all

      select
        ps.game_id,
        ps.entity_id,
        ps.target_id,
        ps.relation
      from placement_state ps
      where ps.playthrough_id = $1
        and ps.target_id = $2
        and not ps.in_inventory

      order by entity_id
    `,
    [playthroughId, targetId],
  );

  return result.rows.map((row) => ({
    gameId: row.game_id,
    entityId: row.entity_id,
    targetId: row.target_id,
    relation: row.relation,
  }));
}