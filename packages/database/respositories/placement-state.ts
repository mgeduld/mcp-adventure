import type { Pool, PoolClient } from "pg";
import { db } from "../src/db.js";
import type { PlacementRelation } from "./placements.js";

type Queryable = Pool | PoolClient;

type PlacementStateRow = {
  target_id: string | null;
  relation: PlacementRelation | null;
  in_inventory: boolean;
};

export type PlacementOverride = {
  targetId: string | null;
  relation: PlacementRelation | null;
  inInventory: boolean;
};

export async function getPlacementOverride(
  playthroughId: string,
  entityId: string,
  queryable: Queryable = db,
): Promise<PlacementOverride | null> {
  const result = await queryable.query<PlacementStateRow>(
    `
      select
        target_id,
        relation,
        in_inventory
      from placement_state
      where playthrough_id = $1 and entity_id = $2
    `,
    [playthroughId, entityId],
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    targetId: row.target_id,
    relation: row.relation,
    inInventory: row.in_inventory,
  };
}