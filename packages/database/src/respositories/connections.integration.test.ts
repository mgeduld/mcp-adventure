import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";
import { db } from "../db.js";
import { getExitsByRoomId } from "./connections.js";

const gameId = "10000000-0000-0000-0000-000000000001";
const throneRoomId = "20000000-0000-0000-0000-000000000001";
const westHallId = "20000000-0000-0000-0000-000000000002";
const dungeonId = "20000000-0000-0000-0000-000000000003";
const redDoorId = "30000000-0000-0000-0000-000000000005";
const hallConnectionId = "40000000-0000-0000-0000-000000000001";
const dungeonConnectionId = "40000000-0000-0000-0000-000000000002";

describe("getExitsByRoomId integration", () => {
  afterAll(async () => {
    await db.end();
  });

  it("reads a forward exit without a door", async () => {
    const exits = await getExitsByRoomId(gameId, throneRoomId);

    expect(exits).toEqual([
      {
        connectionId: hallConnectionId,
        direction: "west",
        destinationRoomId: westHallId,
        portalEntityId: null,
      },
    ]);
  });

  it("reads forward and reverse exits from the same room", async () => {
    const exits = await getExitsByRoomId(gameId, westHallId);

    expect(exits).toEqual([
      {
        connectionId: hallConnectionId,
        direction: "east",
        destinationRoomId: throneRoomId,
        portalEntityId: null,
      },
      {
        connectionId: dungeonConnectionId,
        direction: "north",
        destinationRoomId: dungeonId,
        portalEntityId: redDoorId,
      },
    ]);
  });

  it("preserves the door on a reverse exit", async () => {
    const exits = await getExitsByRoomId(gameId, dungeonId);

    expect(exits).toEqual([
      {
        connectionId: dungeonConnectionId,
        direction: "south",
        destinationRoomId: westHallId,
        portalEntityId: redDoorId,
      },
    ]);
  });

  it("returns an empty array for an unknown room", async () => {
    const exits = await getExitsByRoomId(
      gameId,
      "00000000-0000-0000-0000-000000000000",
    );

    expect(exits).toEqual([]);
  });

  it("does not return another game's connections", async () => {
    const client = await db.connect();

    try {
      await client.query("begin");

      const result = await client.query<{ id: string }>(
        `
          insert into games (slug, name)
          values ($1, $2)
          returning id
        `,
        ["exit-lookup-test", "Exit Lookup Test"],
      );

      const otherGame = result.rows[0];

      if (!otherGame) {
        throw new Error("Failed to create test game");
      }

      expect(
        await getExitsByRoomId(otherGame.id, westHallId, client),
      ).toEqual([]);
    } finally {
      await client.query("rollback");
      client.release();
    }
  });
});