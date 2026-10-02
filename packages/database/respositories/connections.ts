import type { Pool, PoolClient } from "pg";
import { db } from "../src/db.js";

type Queryable = Pool | PoolClient;

type RoomExitRow = {
  connection_id: string;
  direction: string;
  destination_room_id: string;
  portal_entity_id: string | null;
};

export type RoomExit = {
  connectionId: string;
  direction: string;
  destinationRoomId: string;
  portalEntityId: string | null;
};

export async function getExitsByRoomId(
  gameId: string,
  roomId: string,
  queryable: Queryable = db,
): Promise<RoomExit[]> {
  const result = await queryable.query<RoomExitRow>(
    `
      select
        id as connection_id,
        direction,
        to_room_id as destination_room_id,
        portal_entity_id
      from connections
      where game_id = $1 and from_room_id = $2

      union all

      select
        id as connection_id,
        reverse_direction as direction,
        from_room_id as destination_room_id,
        portal_entity_id
      from connections
      where game_id = $1 and to_room_id = $2

      order by direction, connection_id
    `, // order by makes the results deterministic. 
    [gameId, roomId],
  );

  return result.rows.map((row) => ({
    connectionId: row.connection_id,
    direction: row.direction,
    destinationRoomId: row.destination_room_id,
    portalEntityId: row.portal_entity_id,
  }));
}