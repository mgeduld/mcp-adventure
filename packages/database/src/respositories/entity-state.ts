import type { Pool, PoolClient } from "pg";
import { db } from "../db.js";

type Queryable = Pool | PoolClient;

type EntityStateRow = {
  state: Record<string, unknown>;
};

export async function getEntityStateOverride(
  playthroughId: string,
  entityId: string,
  queryable: Queryable = db,
): Promise<Record<string, unknown> | null> {
  /*
    The schema’s primary key is (playthrough_id, entity_id), so this query
    can return at most one row. Its foreign keys ensure the entity and playthrough 
    belong to the same game.
  */
  const result = await queryable.query<EntityStateRow>(
    `
      select state
      from entity_state
      where playthrough_id = $1 and entity_id = $2
    `,
    [playthroughId, entityId],
  );

  return result.rows[0]?.state ?? null;
}