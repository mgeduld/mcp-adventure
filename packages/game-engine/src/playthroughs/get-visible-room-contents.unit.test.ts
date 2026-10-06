import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  getPlaythroughById: vi.fn(),
  getEntityById: vi.fn(),
  getCurrentPlacementsByTarget: vi.fn(),
  getCurrentEntityState: vi.fn(),
}));

vi.mock("@mcp-adventure/database", () => ({
  getPlaythroughById: mocks.getPlaythroughById,
  getEntityById: mocks.getEntityById,
  getCurrentPlacementsByTarget: mocks.getCurrentPlacementsByTarget,
}));

vi.mock("../entities/get-current-entity-state.js", () => ({
  getCurrentEntityState: mocks.getCurrentEntityState,
}));

import { getVisibleRoomContents } from "./get-visible-room-contents.js";

describe("getVisibleRoomContents", () => {
  beforeEach(() => {
    mocks.getPlaythroughById.mockReset();
    mocks.getEntityById.mockReset();
    mocks.getCurrentPlacementsByTarget.mockReset();
    mocks.getCurrentEntityState.mockReset();

    mocks.getPlaythroughById.mockResolvedValue({
      id: "playthrough-id",
      gameId: "game-id",
      currentRoomId: "room-id",
    });

    const entities = [
      {
        id: "room-id",
        kind: "room",
        name: "Throne Room",
        description: "A throne room.",
        properties: {},
      },
      {
        id: "table-id",
        kind: "fixture",
        name: "table",
        description: "A table.",
        properties: { surface: true },
      },
      {
        id: "chest-id",
        kind: "object",
        name: "chest",
        description: "A chest.",
        properties: { openable: true, container: true, surface: true },
      },
      {
        id: "lantern-id",
        kind: "object",
        name: "lantern",
        description: "A lantern.",
        properties: {},
      },
      {
        id: "key-id",
        kind: "object",
        name: "key",
        description: "A key.",
        properties: {},
      },
    ];

    mocks.getEntityById.mockImplementation(
      async (gameId: string, entityId: string) =>
        gameId === "game-id"
          ? entities.find((entity) => entity.id === entityId) ?? null
          : null,
    );

    const placements = [
      {
        gameId: "game-id",
        entityId: "table-id",
        targetId: "room-id",
        relation: "in",
      },
      {
        gameId: "game-id",
        entityId: "chest-id",
        targetId: "table-id",
        relation: "on",
      },
      {
        gameId: "game-id",
        entityId: "lantern-id",
        targetId: "chest-id",
        relation: "in",
      },
      {
        gameId: "game-id",
        entityId: "key-id",
        targetId: "chest-id",
        relation: "on",
      },
    ];

    mocks.getCurrentPlacementsByTarget.mockImplementation(
      async (_playthroughId: string, targetId: string) =>
        placements.filter((placement) => placement.targetId === targetId),
    );

    mocks.getCurrentEntityState.mockResolvedValue({
      open: false,
    });
  });

  it("hides closed-container interiors but shows objects on top", async () => {
    const contents = await getVisibleRoomContents("playthrough-id");

    expect(contents).toEqual([
      {
        id: "table-id",
        name: "table",
        description: "A table.",
        targetId: "room-id",
        relation: "in",
      },
      {
        id: "chest-id",
        name: "chest",
        description: "A chest.",
        targetId: "table-id",
        relation: "on",
      },
      {
        id: "key-id",
        name: "key",
        description: "A key.",
        targetId: "chest-id",
        relation: "on",
      },
    ]);

    expect(mocks.getCurrentEntityState).toHaveBeenCalledWith(
      "playthrough-id",
      "chest-id",
    );
  });

  it("shows contents inside an open container", async () => {
    mocks.getCurrentEntityState.mockResolvedValue({
      open: true,
    });

    const contents = await getVisibleRoomContents("playthrough-id");

    expect(contents.map((entity) => entity.id)).toEqual([
      "table-id",
      "chest-id",
      "lantern-id",
      "key-id",
    ]);
  });

  it("rejects an unknown playthrough", async () => {
    mocks.getPlaythroughById.mockResolvedValue(null);

    await expect(
      getVisibleRoomContents("unknown-id"),
    ).rejects.toThrow("Playthrough not found: unknown-id");

    expect(mocks.getEntityById).not.toHaveBeenCalled();
  });

  it("rejects a missing current room", async () => {
    mocks.getEntityById.mockResolvedValue(null);

    await expect(
      getVisibleRoomContents("playthrough-id"),
    ).rejects.toThrow("Current room not found: room-id");
  });

  it("rejects a placement cycle", async () => {
    mocks.getCurrentPlacementsByTarget.mockResolvedValue([
      {
        gameId: "game-id",
        entityId: "room-id",
        targetId: "room-id",
        relation: "in",
      },
    ]);

    await expect(
      getVisibleRoomContents("playthrough-id"),
    ).rejects.toThrow("Placement infinte cycle detected: room-id");
  });
});