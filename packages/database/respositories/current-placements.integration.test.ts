import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";
import { db } from "../src/db.js";
import { createPlaythrough } from "./playthroughs.js";
import { getCurrentPlacementsByTarget } from "./placements.js";

const gameId = "10000000-0000-0000-0000-000000000001";
const throneRoomId = "20000000-0000-0000-0000-000000000001";
const tableId = "30000000-0000-0000-0000-000000000001";
const chestId = "30000000-0000-0000-0000-000000000002";
const lanternId = "30000000-0000-0000-0000-000000000003";
const keyId = "30000000-0000-0000-0000-000000000004";

describe("getCurrentPlacementsByTarget integration", () => {
  afterAll(async () => {
    await db.end();
  });

  it("uses current placements and isolates playthroughs", async () => {
    const client = await db.connect();

    try {
      await client.query("begin");

      const first = await createPlaythrough(
        {
          gameId,
          currentRoomId: throneRoomId,
          resumeTokenHash: "current-placements-first-test",
        },
        client,
      );

      const second = await createPlaythrough(
        {
          gameId,
          currentRoomId: throneRoomId,
          resumeTokenHash: "current-placements-second-test",
        },
        client,
      );

      const authoredRoomPlacements = [
        {
          gameId,
          entityId: tableId,
          targetId: throneRoomId,
          relation: "in",
        },
        {
          gameId,
          entityId: keyId,
          targetId: throneRoomId,
          relation: "in",
        },
      ];

      expect(
        await getCurrentPlacementsByTarget(
          first.id,
          throneRoomId,
          client,
        ),
      ).toEqual(authoredRoomPlacements);

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
            ($1, $2, $4, $5, 'on', false)
        `,
        [gameId, first.id, keyId, lanternId, tableId],
      );

      // The key is now in inventory.
      expect(
        await getCurrentPlacementsByTarget(
          first.id,
          throneRoomId,
          client,
        ),
      ).toEqual([authoredRoomPlacements[0]]);

      // The lantern has moved out of the chest.
      expect(
        await getCurrentPlacementsByTarget(
          first.id,
          chestId,
          client,
        ),
      ).toEqual([]);

      // Both the chest and relocated lantern are on the table.
      expect(
        await getCurrentPlacementsByTarget(
          first.id,
          tableId,
          client,
        ),
      ).toEqual([
        {
          gameId,
          entityId: chestId,
          targetId: tableId,
          relation: "on",
        },
        {
          gameId,
          entityId: lanternId,
          targetId: tableId,
          relation: "on",
        },
      ]);

      // The other playthrough still uses authored locations.
      expect(
        await getCurrentPlacementsByTarget(
          second.id,
          throneRoomId,
          client,
        ),
      ).toEqual(authoredRoomPlacements);

      expect(
        await getCurrentPlacementsByTarget(
          second.id,
          chestId,
          client,
        ),
      ).toEqual([
        {
          gameId,
          entityId: lanternId,
          targetId: chestId,
          relation: "in",
        },
      ]);
    } finally {
      await client.query("rollback");
      client.release();
    }
  });

  it("returns no placements for an unknown playthrough", async () => {
    expect(
      await getCurrentPlacementsByTarget(
        "00000000-0000-0000-0000-000000000000",
        throneRoomId,
      ),
    ).toEqual([]);
  });
});