import type { Pool, PoolClient } from "pg";
import { db } from "../db.js";

type Queryable = Pool | PoolClient;

export type EntityKind = "room" | "object" | "fixture";

type EntityRow = {
  id: string;
  game_id: string;
  slug: string;
  name: string;
  description: string | null;
  kind: EntityKind;
  properties: Record<string, unknown>;
  initial_state: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

export type Entity = {
  id: string;
  gameId: string;
  slug: string;
  name: string;
  description: string | null;
  kind: EntityKind;
  properties: Record<string, unknown>;
  initialState: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export async function getEntityById(
  gameId: string,
  entityId: string,
  queryable: Queryable = db,
): Promise<Entity | null> {
  const result = await queryable.query<EntityRow>(
    `
      select
        id,
        game_id,
        slug,
        name,
        description,
        kind,
        properties,
        initial_state,
        created_at,
        updated_at
      from entities
      where game_id = $1 and id = $2
    `,
    [gameId, entityId],
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    gameId: row.game_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    kind: row.kind,
    properties: row.properties,
    initialState: row.initial_state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}