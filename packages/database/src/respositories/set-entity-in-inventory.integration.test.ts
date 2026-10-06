import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";
import { db } from "../db.js";
import { createPlaythrough } from "./playthroughs.js";
import { getPlacementByEntityId } from "./placements.js";
import {
  getInventoryEntityIds,
  getPlacementOverride,
  setEntityInInventory,
} from "./placement-state.js";

const gameId = "10000000-0000-0000-0000-000000000001";
const throneRoomId = "20000000-0000-0000-0000-000000000001";
const tableId = "30000000-0000-0000-0000-000000000001";
const keyId = "30000000-0000-0000-0000-000000000004";

describe("setEntityInInventory integration", () => {
  afterAll(async () => {
    await db.end();
  });

  it("inserts and replaces inventory overrides without changing authored placement", async () => {
    const client = await db.connect();

    try {
      await client.query("begin");

      const playthrough = await createPlaythrough(
        {
          gameId,
          currentRoomId: throneRoomId,
          resumeTokenHash: "set-inventory-test",
        },
        client,
      );

      await setEntityInInventory(
        gameId,
        playthrough.id,
        keyId,
        client,
      );

      expect(
        await getPlacementOverride(playthrough.id, keyId, client),
      ).toEqual({
        targetId: null,
        relation: null,
        inInventory: true,
      });

      // Simulate a previously saved placement on the table.
      await client.query(
        `
          update placement_state
          set
            target_id = $3,
            relation = 'on',
            in_inventory = false
          where playthrough_id = $1 and entity_id = $2
        `,
        [playthrough.id, keyId, tableId],
      );

      await setEntityInInventory(
        gameId,
        playthrough.id,
        keyId,
        client,
      );

      // Repeating the write must remain valid.
      await setEntityInInventory(
        gameId,
        playthrough.id,
        keyId,
        client,
      );

      expect(
        await getPlacementOverride(playthrough.id, keyId, client),
      ).toEqual({
        targetId: null,
        relation: null,
        inInventory: true,
      });

      expect(
        await getInventoryEntityIds(playthrough.id, client),
      ).toEqual([keyId]);

      expect(
        await getPlacementByEntityId(gameId, keyId, client),
      ).toEqual({
        gameId,
        entityId: keyId,
        targetId: throneRoomId,
        relation: "in",
      });
    } finally {
      await client.query("rollback");
      client.release();
    }
  });
});