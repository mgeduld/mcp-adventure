import {
  getPlaythroughById,
  getEntityById,
  getInventoryEntityIds,
  type Queryable
} from "@mcp-adventure/database";
import { getCurrentEntityState } from "../entities/get-current-entity-state.js";
import { getVisibleRoomContents } from "./get-visible-room-contents.js";

/*
 a room is lit when:
  - naturallyLit is true
  or
  - an entity with lightSource = true and current state = on: true 
  is exposed (not hidden inside something) in the room or directly carried.
*/

export async function isCurrentRoomLit(
  playthroughId: string,
  queryable?: Queryable,
): Promise<boolean> {
  const playthrough = await getPlaythroughById(playthroughId, queryable);

  if (!playthrough) {
    throw new Error(`Playthrough not found: ${playthroughId}`);
  }

  const room = await getEntityById(
    playthrough.gameId,
    playthrough.currentRoomId,
    queryable
  );

  if (!room || room.kind !== "room") {
    throw new Error(
      `Current room not found: ${playthrough.currentRoomId}`,
    );
  }

  if (room.properties.naturallyLit === true) {
    return true;
  }

  const contents = await getVisibleRoomContents(playthroughId, queryable);
  const inventoryIds = await getInventoryEntityIds(playthroughId, queryable);

  const candidateIds = [
    ...contents.map((entity) => entity.id),
    ...inventoryIds,
  ];

  for (const entityId of candidateIds) {
    const entity = await getEntityById(
      playthrough.gameId,
      entityId,
      queryable
    );

    if (!entity) {
      throw new Error(`Entity not found in game: ${entityId}`);
    }

    if (entity.properties.lightSource !== true) {
      continue;
    }

    const state = await getCurrentEntityState(
      playthroughId,
      entityId,
      queryable
    );

    if (state.on === true) {
      return true;
    }
  }

  return false;
}