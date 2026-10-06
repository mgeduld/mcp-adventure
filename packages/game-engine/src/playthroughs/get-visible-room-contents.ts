import {
  getPlaythroughById,
  getEntityById,
  getCurrentPlacementsByTarget,
  type Entity,
  type PlacementRelation,
} from "@mcp-adventure/database";
import { getCurrentEntityState } from "../entities/get-current-entity-state.js";

export type VisibleRoomEntity = {
  id: string;
  name: string;
  description: string | null;
  targetId: string;
  relation: PlacementRelation;
};

export async function getVisibleRoomContents(
  playthroughId: string,
): Promise<VisibleRoomEntity[]> {
  const playthrough = await getPlaythroughById(playthroughId);

  if (!playthrough) {
    throw new Error(`Playthrough not found: ${playthroughId}`);
  }

  const gameId = playthrough.gameId;

  const room = await getEntityById(
    playthrough.gameId,
    playthrough.currentRoomId,
  );

  if (!room || room.kind !== "room") {
    throw new Error(
      `Current room not found: ${playthrough.currentRoomId}`,
    );
  }

  const visible: VisibleRoomEntity[] = [];
  const visited = new Set<string>([room.id]);

  /*
   Recursively walks outward-to-inward, e.g. room → table → chest → lantern. 
   Each placement retains its immediate target, so we can distinguish “on the table” 
   from “in the room.”
  */

  async function visitContents(target: Entity): Promise<void> {
    const placements = await getCurrentPlacementsByTarget(
      playthroughId,
      target.id,
    );

    const hidesInterior =
      target.properties.openable === true &&
      (await getCurrentEntityState(playthroughId, target.id)).open !== true;

    for (const placement of placements) {
      if (placement.relation === "in" && hidesInterior) {
        continue;
      }

      /*
        This cycle guard prevents endless traversal. E.g box -> bag -> box ...
        The existing database trigger checks authored placements,
        but playthrough overrides currently have no equivalent cycle check. <-- TODO: add?
      */
      if (visited.has(placement.entityId)) {
        throw new Error(
          `Placement infinte cycle detected: ${placement.entityId}`,
        );
      }

      const entity = await getEntityById(
        gameId,
        placement.entityId,
      );

      if (!entity) {
        throw new Error(
          `Entity not found in game: ${placement.entityId}`,
        );
      }

      visited.add(entity.id);

      visible.push({
        id: entity.id,
        name: entity.name,
        description: entity.description,
        targetId: target.id,
        relation: placement.relation,
      });

      await visitContents(entity);
    }
  }

  await visitContents(room);

  return visible;
}