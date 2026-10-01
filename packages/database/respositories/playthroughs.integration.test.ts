import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";
import { db } from "../src/db.js";
import { getGameBySlug } from "./games.js";
import { createPlaythrough } from "./playthroughs.js";

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
});