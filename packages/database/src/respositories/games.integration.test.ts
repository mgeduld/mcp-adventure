import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";
import { db } from "../db.js";
import { getGameBySlug } from "../respositories/games.js";

describe("getGameBySlug integration", () => {
  afterAll(async () => {
    await db.end();
  });

  it("reads the seeded game from PostgreSQL", async () => {
    const game =
      await getGameBySlug("forgotten-keep");

    expect(game).toMatchObject({
      slug: "forgotten-keep",
      name: "The Forgotten Keep",
    });

    expect(game?.description).toEqual(
      expect.any(String),
    );
  });

  it("returns null for an unknown slug", async () => {
    const game =
      await getGameBySlug("nonexistent-game");

    expect(game).toBeNull();
  });
});