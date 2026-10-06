import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";
import { db } from "../src/db.js";
import { createPlaythrough } from "./playthroughs.js";
import { getInventoryEntityIds } from "./placement-state.js";

const gameId = "10000000-0000-0000-0000-000000000001";
const throneRoomId = "20000000-0000-0000-0000-000000000001";
const chestId = "30000000-0000-0000-0000-000000000002";
const lanternId = "30000000-0000-0000-0000-000000000003";
const keyId = "30000000-0000-0000-0000-000000000004";

describe("getInventoryEntityIds integration", () => {
  afterAll(async () => {
    await db.end();
  });

  it("returns only the requested playthrough's carried entities", async () => {
    const client = await db.connect();

    try {
      await client.query("begin");

      const first = await createPlaythrough(
        {
          gameId,
          currentRoomId: throneRoomId,
          resumeTokenHash: "inventory-first-test",
        },
        client,
      );

      const second = await createPlaythrough(
        {
          gameId,
          currentRoomId: throneRoomId,
          resumeTokenHash: "inventory-second-test",
        },
        client,
      );

      expect(
        await getInventoryEntityIds(first.id, client),
      ).toEqual([]);

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
          values
            ($1, $2, $3, null, null, true),
            ($1, $2, $4, $5, 'in', false),
            ($1, $6, $7, null, null, true)
        `,
        [
          gameId,
          first.id,
          lanternId,
          chestId,
          throneRoomId,
          second.id,
          keyId,
        ],
      );

      expect(
        await getInventoryEntityIds(first.id, client),
      ).toEqual([lanternId]);

      expect(
        await getInventoryEntityIds(second.id, client),
      ).toEqual([keyId]);
    } finally {
      await client.query("rollback");
      client.release();
    }
  });
});