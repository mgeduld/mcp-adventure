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