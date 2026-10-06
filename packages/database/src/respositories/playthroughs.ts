import type { Pool, PoolClient } from "pg";
import { db } from "../db.js";

type Queryable = Pool | PoolClient;

type PlaythroughRow = {
  id: string;
  game_id: string;
  current_room_id: string;
  world_state: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

export type Playthrough = {
  id: string;
  gameId: string;
  currentRoomId: string;
  worldState: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePlaythroughInput = {
  gameId: string;
  currentRoomId: string;
  resumeTokenHash: string;
};

export async function createPlaythrough(
  input: CreatePlaythroughInput,
  queryable: Queryable = db,
): Promise<Playthrough> {
  const result = await queryable.query<PlaythroughRow>(
    `
      insert into playthroughs (
        game_id,
        current_room_id,
        resume_token_hash
      )
      values ($1, $2, $3)
      returning
        id,
        game_id,
        current_room_id,
        world_state,
        created_at,
        updated_at
    `,
    [
      input.gameId,
      input.currentRoomId,
      input.resumeTokenHash,
    ],
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error("Failed to create playthrough");
  }

  return {
    id: row.id,
    gameId: row.game_id,
    currentRoomId: row.current_room_id,
    worldState: row.world_state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPlaythroughById(
  id: string,
  queryable: Queryable = db,
): Promise<Playthrough | null> {
  const result = await queryable.query<PlaythroughRow>(
    `
      select
        id,
        game_id,
        current_room_id,
        world_state,
        created_at,
        updated_at
      from playthroughs
      where id = $1
    `,
    [id],
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    gameId: row.game_id,
    currentRoomId: row.current_room_id,
    worldState: row.world_state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}