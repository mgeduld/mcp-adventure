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
  getInventoryEntityIds: vi.fn(),
  getVisibleRoomContents: vi.fn(),
  getCurrentEntityState: vi.fn(),
}));

vi.mock("@mcp-adventure/database", () => ({
  getPlaythroughById: mocks.getPlaythroughById,
  getEntityById: mocks.getEntityById,
  getInventoryEntityIds: mocks.getInventoryEntityIds,
}));

vi.mock("./get-visible-room-contents.js", () => ({
  getVisibleRoomContents: mocks.getVisibleRoomContents,
}));

vi.mock("../entities/get-current-entity-state.js", () => ({
  getCurrentEntityState: mocks.getCurrentEntityState,
}));

import { isCurrentRoomLit } from "./is-current-room-lit.js";

describe("isCurrentRoomLit", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }

    mocks.getPlaythroughById.mockResolvedValue({
      id: "playthrough-id",
      gameId: "game-id",
      currentRoomId: "room-id",
    });

    mocks.getEntityById.mockImplementation(
      async (_gameId: string, entityId: string) => {
        if (entityId === "room-id") {
          return {
            id: "room-id",
            kind: "room",
            properties: { naturallyLit: false },
          };
        }

        return {
          id: entityId,
          properties: { lightSource: true },
        };
      },
    );

    mocks.getVisibleRoomContents.mockResolvedValue([]);
    mocks.getInventoryEntityIds.mockResolvedValue([]);
    mocks.getCurrentEntityState.mockResolvedValue({ on: false });
  });

  it("recognizes natural lighting without checking objects", async () => {
    mocks.getEntityById.mockResolvedValue({
      id: "room-id",
      kind: "room",
      properties: { naturallyLit: true },
    });

    expect(await isCurrentRoomLit("playthrough-id")).toBe(true);

    expect(mocks.getVisibleRoomContents).not.toHaveBeenCalled();
    expect(mocks.getInventoryEntityIds).not.toHaveBeenCalled();
  });

  it("recognizes an active carried lantern", async () => {
    mocks.getInventoryEntityIds.mockResolvedValue(["lantern-id"]);
    mocks.getCurrentEntityState.mockResolvedValue({ on: true });

    expect(await isCurrentRoomLit("playthrough-id")).toBe(true);

    expect(mocks.getInventoryEntityIds).toHaveBeenCalledWith(
      "playthrough-id",
      undefined
    );

    expect(mocks.getCurrentEntityState).toHaveBeenCalledWith(
      "playthrough-id",
      "lantern-id",
      undefined
    );
  });

  it("recognizes an active exposed lantern in the room", async () => {
    mocks.getVisibleRoomContents.mockResolvedValue([
      { id: "lantern-id" },
    ]);
    mocks.getCurrentEntityState.mockResolvedValue({ on: true });

    expect(await isCurrentRoomLit("playthrough-id")).toBe(true);
  });

  it("remains dark when a carried lantern is off", async () => {
    mocks.getInventoryEntityIds.mockResolvedValue(["lantern-id"]);

    expect(await isCurrentRoomLit("playthrough-id")).toBe(false);
  });

  it("remains dark when no light source is exposed or carried", async () => {
    expect(await isCurrentRoomLit("playthrough-id")).toBe(false);

    expect(mocks.getCurrentEntityState).not.toHaveBeenCalled();
  });

  it("ignores an on state on an entity without lightSource", async () => {
    mocks.getInventoryEntityIds.mockResolvedValue(["key-id"]);
    mocks.getCurrentEntityState.mockResolvedValue({ on: true });

    mocks.getEntityById.mockImplementation(
      async (_gameId: string, entityId: string) =>
        entityId === "room-id"
          ? {
              id: "room-id",
              kind: "room",
              properties: { naturallyLit: false },
            }
          : {
              id: "key-id",
              properties: {},
            },
    );

    expect(await isCurrentRoomLit("playthrough-id")).toBe(false);

    expect(mocks.getCurrentEntityState).not.toHaveBeenCalled();
  });

  it("rejects an unknown playthrough", async () => {
    mocks.getPlaythroughById.mockResolvedValue(null);

    await expect(
      isCurrentRoomLit("unknown-id"),
    ).rejects.toThrow("Playthrough not found: unknown-id");

    expect(mocks.getEntityById).not.toHaveBeenCalled();
  });

  it("rejects a missing current room", async () => {
    mocks.getEntityById.mockResolvedValue(null);

    await expect(
      isCurrentRoomLit("playthrough-id"),
    ).rejects.toThrow("Current room not found: room-id");
  });
});