import { createHash } from "node:crypto";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const databaseMocks = vi.hoisted(() => ({
  getGameBySlug: vi.fn(),
  createPlaythrough: vi.fn(),
}));

vi.mock("@mcp-adventure/database", () => ({
  getGameBySlug: databaseMocks.getGameBySlug,
  createPlaythrough: databaseMocks.createPlaythrough,
}));

import { startPlaythrough } from "./start-playthrough.js";

describe("startPlaythrough", () => {
  beforeEach(() => {
    databaseMocks.getGameBySlug.mockReset();
    databaseMocks.createPlaythrough.mockReset();
  });

  it("creates a playthrough in the game's starting room", async () => {
    databaseMocks.getGameBySlug.mockResolvedValue({
      id: "game-id",
      slug: "forgotten-keep",
      name: "The Forgotten Keep",
      description: "A demonstration game.",
      startingRoomId: "throne-room-id",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    });

    databaseMocks.createPlaythrough.mockResolvedValue({
      id: "playthrough-id",
      gameId: "game-id",
      currentRoomId: "throne-room-id",
      worldState: {},
      createdAt: new Date("2026-01-02"),
      updatedAt: new Date("2026-01-02"),
    });

    const result =
      await startPlaythrough("forgotten-keep");

    expect(
      databaseMocks.getGameBySlug,
    ).toHaveBeenCalledWith("forgotten-keep");

    expect(result).toMatchObject({
      id: "playthrough-id",
      gameId: "game-id",
      currentRoomId: "throne-room-id",
      worldState: {},
    });

    expect(result.resumeToken).toEqual(
      expect.any(String),
    );

    const expectedHash = createHash("sha256")
      .update(result.resumeToken)
      .digest("hex");

    expect(
      databaseMocks.createPlaythrough,
    ).toHaveBeenCalledWith({
      gameId: "game-id",
      currentRoomId: "throne-room-id",
      resumeTokenHash: expectedHash,
    });
  });

  it("rejects an unknown game", async () => {
    databaseMocks.getGameBySlug.mockResolvedValue(null);

    await expect(
      startPlaythrough("unknown-game"),
    ).rejects.toThrow(
      "Game not found: unknown-game",
    );

    expect(
      databaseMocks.createPlaythrough,
    ).not.toHaveBeenCalled();
  });

  it("rejects a game without a starting room", async () => {
    databaseMocks.getGameBySlug.mockResolvedValue({
      id: "game-id",
      slug: "unfinished-game",
      name: "Unfinished Game",
      description: null,
      startingRoomId: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    });

    await expect(
      startPlaythrough("unfinished-game"),
    ).rejects.toThrow(
      "Game has no starting room: unfinished-game",
    );

    expect(
      databaseMocks.createPlaythrough,
    ).not.toHaveBeenCalled();
  });
});