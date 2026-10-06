import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";
import { db } from "../db.js";
import { getGameBySlug } from "./games.js";
import {
  createPlaythrough,
  getPlaythroughById,
} from "./playthroughs.js";

describe("createPlaythrough integration", () => {
  afterAll(async () => {
    await db.end();
  });

  it("persists a playthrough", async () => {
    const client = await db.connect();

    try {
      await client.query("begin");

      const game = await getGameBySlug(
        "forgotten-keep",
        client,
      );

      if (!game?.startingRoomId) {
        throw new Error(
          "Seeded game or starting room is missing",
        );
      }

      const playthrough = await createPlaythrough(
        {
          gameId: game.id,
          currentRoomId: game.startingRoomId,
          resumeTokenHash: "integration-test-hash",
        },
        client,
      );

      expect(playthrough).toMatchObject({
        gameId: game.id,
        currentRoomId: game.startingRoomId,
        worldState: {},
      });

      const stored = await client.query<{
        resume_token_hash: string;
      }>(
        `
          select resume_token_hash
          from playthroughs
          where id = $1
        `,
        [playthrough.id],
      );

      expect(
        stored.rows[0]?.resume_token_hash,
      ).toBe("integration-test-hash");
    } finally {
      await client.query("rollback");
      client.release();
    }
  });

  it("reads a playthrough by ID", async () => {
    const client = await db.connect();

    try {
      await client.query("begin");

      const game = await getGameBySlug(
        "forgotten-keep",
        client,
      );

      if (!game?.startingRoomId) {
        throw new Error(
          "Seeded game or starting room is missing",
        );
      }

      const created = await createPlaythrough(
        {
          gameId: game.id,
          currentRoomId: game.startingRoomId,
          resumeTokenHash: "lookup-integration-test-hash",
        },
        client,
      );

      const found = await getPlaythroughById(
        created.id,
        client,
      );

      expect(found).toEqual(created);
      expect(found).not.toHaveProperty("resumeTokenHash");
      expect(found).not.toHaveProperty("resume_token_hash");
    } finally {
      await client.query("rollback");
      client.release();
    }
  });

  it("returns null for an unknown playthrough ID", async () => {
    const found = await getPlaythroughById(
      "00000000-0000-0000-0000-000000000000",
    );

    expect(found).toBeNull();
  });
});