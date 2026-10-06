import {
  getPlaythroughById,
  getEntityById,
  getEntityStateOverride,
} from "@mcp-adventure/database";

import type { Queryable } from "@mcp-adventure/database";

export async function getCurrentEntityState(
  playthroughId: string,
  entityId: string,
  queryable?: Queryable,
): Promise<Record<string, unknown>> {
  const playthrough = await getPlaythroughById(playthroughId, queryable);

  if (!playthrough) {
    throw new Error(`Playthrough not found: ${playthroughId}`);
  }

  const entity = await getEntityById(
    playthrough.gameId,
    entityId,
    queryable
  );

  if (!entity) {
    throw new Error(`Entity not found in game: ${entityId}`);
  }

  const override = await getEntityStateOverride(
    playthroughId,
    entityId,
    queryable
  );

  return {
    ...entity.initialState,
    ...(override ?? {}),
  };
}