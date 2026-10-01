import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const databaseMocks = vi.hoisted(() => ({
  getGameBySlug: vi.fn(),
}));

vi.mock("@mcp-adventure/database", () => ({
  getGameBySlug: databaseMocks.getGameBySlug,
}));

import { getGameInfo } from "./get-game-info.js";

describe("getGameInfo", () => {
  beforeEach(() => {
    databaseMocks.getGameBySlug.mockReset();
  });

  it("returns public game information", async () => {
    databaseMocks.getGameBySlug.mockResolvedValue({
      id: "game-id",
      slug: "forgotten-keep",
      name: "The Forgotten Keep",
      description: "A demonstration game.",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
    });

    const result = await getGameInfo("forgotten-keep");

    expect(
      databaseMocks.getGameBySlug,
    ).toHaveBeenCalledWith("forgotten-keep");

    expect(result).toEqual({
      slug: "forgotten-keep",
      name: "The Forgotten Keep",
      description: "A demonstration game.",
    });
  });

  it("returns null when the game does not exist", async () => {
    databaseMocks.getGameBySlug.mockResolvedValue(null);

    const result = await getGameInfo("missing-game");

    expect(result).toBeNull();
  });
});