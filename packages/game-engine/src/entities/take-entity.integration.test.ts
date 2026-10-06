import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";
import {
  db,
  getInventoryEntityIds,
  getPlacementOverride,
} from "@mcp-adventure/database";
import { startPlaythrough } from "../playthroughs/start-playthrough.js";
import { getSituation } from "../playthroughs/get-situation.js";
import { takeEntity } from "./take-entity.js";

const keyId = "30000000-0000-0000-0000-000000000004";

describe("takeEntity integration", () => {
  afterAll(async () => {
    await db.end();
  });

  it("takes the blue key, persists it, and handles concurrent retries", async () => {
    const playthrough = await startPlaythrough("forgotten-keep");

    try {
      const results = await Promise.all([
        takeEntity(playthrough.id, keyId),
        takeEntity(playthrough.id, keyId),
      ]);

      expect(results.map((result) => result.status).sort()).toEqual([
        "already_carried",
        "taken",
      ]);

      for (const result of results) {
        expect(result).toMatchObject({
          entityId: keyId,
          name: "blue key",
        });
      }

      expect(
        await getInventoryEntityIds(playthrough.id),
      ).toEqual([keyId]);

      expect(
        await getPlacementOverride(playthrough.id, keyId),
      ).toEqual({
        targetId: null,
        relation: null,
        inInventory: true,
      });

      const situation = await getSituation(playthrough.id);

      expect(
        situation.contents.some((entity) => entity.id === keyId),
      ).toBe(false);
    } finally {
      await db.query(
        "delete from playthroughs where id = $1",
        [playthrough.id],
      );
    }
  });

  it.each([
    [
      "30000000-0000-0000-0000-000000000002",
      "Entity is not portable: iron chest",
    ],
    [
      "30000000-0000-0000-0000-000000000003",
      "Entity is not visible and reachable: brass lantern",
    ],
    [
      "30000000-0000-0000-0000-000000000008",
      "Entity is not visible and reachable: rusty sword",
    ],
    [
      "00000000-0000-0000-0000-000000000000",
      "Entity not found in game:",
    ],
  ])("rejects taking %s without writing an override", async (
    entityId,
    expectedError,
  ) => {
    const playthrough = await startPlaythrough("forgotten-keep");

    try {
      await expect(
        takeEntity(playthrough.id, entityId),
      ).rejects.toThrow(expectedError);

      expect(
        await getPlacementOverride(playthrough.id, entityId),
      ).toBeNull();

      expect(
        await getInventoryEntityIds(playthrough.id),
      ).toEqual([]);
    } finally {
      await db.query(
        "delete from playthroughs where id = $1",
        [playthrough.id],
      );
    }
  });

  it("rejects an unknown playthrough", async () => {
    await expect(
      takeEntity(
        "00000000-0000-0000-0000-000000000000",
        keyId,
      ),
    ).rejects.toThrow("Playthrough not found:");
  });
});