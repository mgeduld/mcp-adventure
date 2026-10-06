import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";
import { db } from "../db.js";
import { createPlaythrough } from "./playthroughs.js";
import { getPlacementOverride } from "./placement-state.js";

const gameId = "10000000-0000-0000-0000-000000000001";
const throneRoomId = "20000000-0000-0000-0000-000000000001";
const tableId = "30000000-0000-0000-0000-000000000001";
const lanternId = "30000000-0000-0000-0000-000000000003";
const keyId = "30000000-0000-0000-0000-000000000004";

describe("getPlacementOverride integration", () => {
  afterAll(async () => {
    await db.end();
  });

  it("reads placement and inventory overrides without mixing identities", async () => {
    const client = await db.connect();

    try {
      await client.query("begin");

      const first = await createPlaythrough(
        {
          gameId,
          currentRoomId: throneRoomId,
          resumeTokenHash: "placement-state-first-test",
        },
        client,
      );

      const second = await createPlaythrough(
        {
          gameId,
          currentRoomId: throneRoomId,
          resumeTokenHash: "placement-state-second-test",
        },
        client,
      );

      expect(
        await getPlacementOverride(first.id, lanternId, client),
      ).toBeNull();

      await client.query(
        `
          insert into placement_state (
            game_id,
            playthrough_id,
            entity_id,
            target_id,
            relation,
            in_inventory
          )
          values ($1, $2, $3, $4, $5, false)
        `,
        [gameId, first.id, lanternId, tableId, "on"],
      );

      expect(
        await getPlacementOverride(first.id, lanternId, client),
      ).toEqual({
        targetId: tableId,
        relation: "on",
        inInventory: false,
      });

      expect(
        await getPlacementOverride(second.id, lanternId, client),
      ).toBeNull();

      expect(
        await getPlacementOverride(first.id, keyId, client),
      ).toBeNull();

      await client.query(
        `
          update placement_state
          set
            target_id = null,
            relation = null,
            in_inventory = true
          where playthrough_id = $1 and entity_id = $2
        `,
        [first.id, lanternId],
      );

      expect(
        await getPlacementOverride(first.id, lanternId, client),
      ).toEqual({
        targetId: null,
        relation: null,
        inInventory: true,
      });
    } finally {
      await client.query("rollback");
      client.release();
    }
  });
});