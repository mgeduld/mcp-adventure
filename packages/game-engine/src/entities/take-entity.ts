import {
  db,
  lockPlaythrough,
  getPlaythroughById,
  getEntityById,
  getPlacementOverride,
  setEntityInInventory,
} from "@mcp-adventure/database";
import { getSituation } from "../playthroughs/get-situation.js";

export type TakeResult = {
  entityId: string;
  name: string;
  status: "taken" | "already_carried";
};

export async function takeEntity(
  playthroughId: string,
  entityId: string,
): Promise<TakeResult> {
  const client = await db.connect();

  try {
    await client.query("begin");
    await lockPlaythrough(playthroughId, client);

    const playthrough = await getPlaythroughById(
      playthroughId,
      client,
    );

    if (!playthrough) {
      throw new Error(`Playthrough not found: ${playthroughId}`);
    }

    const entity = await getEntityById(
      playthrough.gameId,
      entityId,
      client,
    );

    if (!entity) {
      throw new Error(`Entity not found in game: ${entityId}`);
    }

    if (entity.properties.portable !== true) {
      throw new Error(`Entity is not portable: ${entity.name}`);
    }

    const placement = await getPlacementOverride(
      playthroughId,
      entityId,
      client,
    );

    if (placement?.inInventory) {
      await client.query("commit");

      return {
        entityId: entity.id,
        name: entity.name,
        status: "already_carried",
      };
    }

    const situation = await getSituation(playthroughId, client);

    if (!situation.contents.some((item) => item.id === entityId)) {
      throw new Error(
        `Entity is not visible and reachable: ${entity.name}`,
      );
    }

    await setEntityInInventory(
      playthrough.gameId,
      playthroughId,
      entityId,
      client,
    );

    await client.query("commit");

    return {
      entityId: entity.id,
      name: entity.name,
      status: "taken",
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}