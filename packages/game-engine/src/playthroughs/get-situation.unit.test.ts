import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const databaseMocks = vi.hoisted(() => ({
  getPlaythroughById: vi.fn(),
  getEntityById: vi.fn(),
}));

vi.mock("@mcp-adventure/database", () => ({
  getPlaythroughById: databaseMocks.getPlaythroughById,
  getEntityById: databaseMocks.getEntityById,
}));

import { getSituation } from "./get-situation.js";

describe("getSituation", () => {
  beforeEach(() => {
    databaseMocks.getPlaythroughById.mockReset();
    databaseMocks.getEntityById.mockReset();

    databaseMocks.getPlaythroughById.mockResolvedValue({
      id: "playthrough-id",
      gameId: "game-id",
      currentRoomId: "throne-room-id",
    });

    databaseMocks.getEntityById.mockResolvedValue({
      id: "throne-room-id",
      kind: "room",
      name: "Throne Room",
      description: "A faded throne faces a scarred oak table.",
    });
  });

  it("returns the playthrough's current room", async () => {
    const situation = await getSituation("playthrough-id");

    expect(
      databaseMocks.getPlaythroughById,
    ).toHaveBeenCalledWith("playthrough-id");

    expect(
      databaseMocks.getEntityById,
    ).toHaveBeenCalledWith("game-id", "throne-room-id");

    expect(situation).toEqual({
      playthroughId: "playthrough-id",
      room: {
        id: "throne-room-id",
        name: "Throne Room",
        description: "A faded throne faces a scarred oak table.",
      },
    });
  });

  it("preserves a null room description", async () => {
    databaseMocks.getEntityById.mockResolvedValue({
      id: "throne-room-id",
      kind: "room",
      name: "Throne Room",
      description: null,
    });

    const situation = await getSituation("playthrough-id");

    expect(situation.room.description).toBeNull();
  });

  it("rejects an unknown playthrough", async () => {
    databaseMocks.getPlaythroughById.mockResolvedValue(null);

    await expect(
      getSituation("unknown-id"),
    ).rejects.toThrow("Playthrough not found: unknown-id");

    expect(databaseMocks.getEntityById).not.toHaveBeenCalled();
  });

  it("rejects a missing current room", async () => {
    databaseMocks.getEntityById.mockResolvedValue(null);

    await expect(
      getSituation("playthrough-id"),
    ).rejects.toThrow("Current room not found: throne-room-id");
  });

  it("rejects a current-room reference to a non-room entity", async () => {
    databaseMocks.getEntityById.mockResolvedValue({
      id: "throne-room-id",
      kind: "object",
    });

    await expect(
      getSituation("playthrough-id"),
    ).rejects.toThrow("Current room not found: throne-room-id");
  });
});