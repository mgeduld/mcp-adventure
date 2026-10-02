import {
  getPlaythroughById,
  getEntityById,
  getPlacementOverride,
  getPlacementByEntityId,
  type PlacementRelation,
} from "@mcp-adventure/database";

export type CurrentPlacement = {
  targetId: string | null;
  relation: PlacementRelation | null;
  inInventory: boolean;
};

export async function getCurrentPlacement(
  playthroughId: string,
  entityId: string,
): Promise<CurrentPlacement | null> {
  const playthrough = await getPlaythroughById(playthroughId);

  if (!playthrough) {
    throw new Error(`Playthrough not found: ${playthroughId}`);
  }

  const entity = await getEntityById(
    playthrough.gameId,
    entityId,
  );

  if (!entity) {
    throw new Error(`Entity not found in game: ${entityId}`);
  }

  const override = await getPlacementOverride(
    playthroughId,
    entityId,
  );

  if (override) {
    return override;
  }

  const placement = await getPlacementByEntityId(
    playthrough.gameId,
    entityId,
  );

  if (!placement) {
    return null;
  }

  return {
    targetId: placement.targetId,
    relation: placement.relation,
    inInventory: false,
  };
}