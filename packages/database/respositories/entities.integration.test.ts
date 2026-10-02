import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";
import { db } from "../src/db.js";
import { getEntityById } from "./entities.js";

const gameId = "10000000-0000-0000-0000-000000000001";
const throneRoomId = "20000000-0000-0000-0000-000000000001";
const unknownId = "00000000-0000-0000-0000-000000000000";

describe("getEntityById integration", () => {
  afterAll(async () => {
    await db.end();
  });

  it("reads the seeded Throne Room", async () => {
    const entity = await getEntityById(
      gameId,
      throneRoomId,
    );

    expect(entity).toEqual({
      id: throneRoomId,
      gameId,
      slug: "throne-room",
      name: "Throne Room",
      description:
        "A faded throne faces tall doors and a scarred oak table.",
      kind: "room",
      properties: { naturallyLit: true },
      initialState: {},
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it("returns null for an unknown entity", async () => {
    const entity = await getEntityById(
      gameId,
      unknownId,
    );

    expect(entity).toBeNull();
  });

  it("returns null when the entity belongs to another game", async () => {
    const client = await db.connect();

    try {
      await client.query("begin");

      const result = await client.query<{ id: string }>(
        `
          insert into games (slug, name)
          values ($1, $2)
          returning id
        `,
        ["entity-lookup-test", "Entity Lookup Test"],
      );

      const otherGame = result.rows[0];

      if (!otherGame) {
        throw new Error("Failed to create test game");
      }

      const entity = await getEntityById(
        otherGame.id,
        throneRoomId,
        client,
      );

      expect(entity).toBeNull();
    } finally {
      await client.query("rollback");
      client.release();
    }
  });
});