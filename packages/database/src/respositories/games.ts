import type { Pool, PoolClient } from "pg";
import { db } from "../db.js";

type Queryable = Pool | PoolClient;

type GameRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  starting_room_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export type Game = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  startingRoomId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getGameBySlug(
  slug: string,
  queryable: Queryable = db,
): Promise<Game | null> {
  const result = await queryable.query<GameRow>(
    `
      select
        id,
        slug,
        name,
        description,
        starting_room_id,
        created_at,
        updated_at
      from games
      where slug = $1
    `,
    [slug],
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    startingRoomId: row.starting_room_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}