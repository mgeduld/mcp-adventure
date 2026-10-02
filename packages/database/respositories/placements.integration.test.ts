import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";
import { db } from "../src/db.js";
import { getPlacementByEntityId } from "./placements.js";

const gameId = "10000000-0000-0000-0000-000000000001";
const throneRoomId = "20000000-0000-0000-0000-000000000001";
const tableId = "30000000-0000-0000-0000-000000000001";
const chestId = "30000000-0000-0000-0000-000000000002";
const lanternId = "30000000-0000-0000-0000-000000000003";

describe("getPlacementByEntityId integration", () => {
  afterAll(async () => {
    await db.end();
  });

  it("reads an in placement", async () => {
    const placement = await getPlacementByEntityId(
      gameId,
      lanternId,
    );

    expect(placement).toEqual({
      gameId,
      entityId: lanternId,
      targetId: chestId,
      relation: "in",
    });
  });

  it("reads an on placement", async () => {
    const placement = await getPlacementByEntityId(
      gameId,
      chestId,
    );

    expect(placement).toEqual({
      gameId,
      entityId: chestId,
      targetId: tableId,
      relation: "on",
    });
  });

  it("returns null for an entity without a placement", async () => {
    const placement = await getPlacementByEntityId(
      gameId,
      throneRoomId,
    );

    expect(placement).toBeNull();
  });

  it("returns null for an unknown entity", async () => {
    const placement = await getPlacementByEntityId(
      gameId,
      "00000000-0000-0000-0000-000000000000",
    );

    expect(placement).toBeNull();
  });

  it("does not return another game's placement", async () => {
    const client = await db.connect();

    try {
      await client.query("begin");

      const result = await client.query<{ id: string }>(
        `
          insert into games (slug, name)
          values ($1, $2)
          returning id
        `,
        ["placement-lookup-test", "Placement Lookup Test"],
      );

      const otherGame = result.rows[0];

      if (!otherGame) {
        throw new Error("Failed to create test game");
      }

      const placement = await getPlacementByEntityId(
        otherGame.id,
        lanternId,
        client,
      );

      expect(placement).toBeNull();
    } finally {
      await client.query("rollback");
      client.release();
    }
  });
});