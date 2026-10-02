import {
  getPlaythroughById,
  getEntityById,
  getEntityStateOverride,
} from "@mcp-adventure/database";

export async function getCurrentEntityState(
  playthroughId: string,
  entityId: string,
): Promise<Record<string, unknown>> {
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

  const override = await getEntityStateOverride(
    playthroughId,
    entityId,
  );

  return {
    ...entity.initialState,
    ...(override ?? {}),
  };
}