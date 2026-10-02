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
  getPlacementOverride: vi.fn(),
  getPlacementByEntityId: vi.fn(),
}));

vi.mock("@mcp-adventure/database", () => ({
  getPlaythroughById: databaseMocks.getPlaythroughById,
  getEntityById: databaseMocks.getEntityById,
  getPlacementOverride: databaseMocks.getPlacementOverride,
  getPlacementByEntityId: databaseMocks.getPlacementByEntityId,
}));

import { getCurrentPlacement } from "./get-current-placement.js";

describe("getCurrentPlacement", () => {
  beforeEach(() => {
    databaseMocks.getPlaythroughById.mockReset();
    databaseMocks.getEntityById.mockReset();
    databaseMocks.getPlacementOverride.mockReset();
    databaseMocks.getPlacementByEntityId.mockReset();

    databaseMocks.getPlaythroughById.mockResolvedValue({
      id: "playthrough-id",
      gameId: "game-id",
    });

    databaseMocks.getEntityById.mockResolvedValue({
      id: "lantern-id",
    });

    databaseMocks.getPlacementOverride.mockResolvedValue(null);

    databaseMocks.getPlacementByEntityId.mockResolvedValue({
      gameId: "game-id",
      entityId: "lantern-id",
      targetId: "chest-id",
      relation: "in",
    });
  });

  it("uses authored placement when no override exists", async () => {
    const placement = await getCurrentPlacement(
      "playthrough-id",
      "lantern-id",
    );

    expect(placement).toEqual({
      targetId: "chest-id",
      relation: "in",
      inInventory: false,
    });

    expect(
      databaseMocks.getPlaythroughById,
    ).toHaveBeenCalledWith("playthrough-id");

    expect(
      databaseMocks.getEntityById,
    ).toHaveBeenCalledWith("game-id", "lantern-id");

    expect(
      databaseMocks.getPlacementOverride,
    ).toHaveBeenCalledWith("playthrough-id", "lantern-id");

    expect(
      databaseMocks.getPlacementByEntityId,
    ).toHaveBeenCalledWith("game-id", "lantern-id");
  });

  it("uses a relocated placement instead of authored placement", async () => {
    databaseMocks.getPlacementOverride.mockResolvedValue({
      targetId: "table-id",
      relation: "on",
      inInventory: false,
    });

    const placement = await getCurrentPlacement(
      "playthrough-id",
      "lantern-id",
    );

    expect(placement).toEqual({
      targetId: "table-id",
      relation: "on",
      inInventory: false,
    });

    expect(
      databaseMocks.getPlacementByEntityId,
    ).not.toHaveBeenCalled();
  });

  it("uses inventory instead of authored placement", async () => {
    databaseMocks.getPlacementOverride.mockResolvedValue({
      targetId: null,
      relation: null,
      inInventory: true,
    });

    const placement = await getCurrentPlacement(
      "playthrough-id",
      "lantern-id",
    );

    expect(placement).toEqual({
      targetId: null,
      relation: null,
      inInventory: true,
    });

    expect(
      databaseMocks.getPlacementByEntityId,
    ).not.toHaveBeenCalled();
  });

  it("returns null when an existing entity has no placement", async () => {
    databaseMocks.getPlacementByEntityId.mockResolvedValue(null);

    const placement = await getCurrentPlacement(
      "playthrough-id",
      "lantern-id",
    );

    expect(placement).toBeNull();
  });

  it("rejects an unknown playthrough", async () => {
    databaseMocks.getPlaythroughById.mockResolvedValue(null);

    await expect(
      getCurrentPlacement("unknown-id", "lantern-id"),
    ).rejects.toThrow("Playthrough not found: unknown-id");

    expect(databaseMocks.getEntityById).not.toHaveBeenCalled();
    expect(databaseMocks.getPlacementOverride).not.toHaveBeenCalled();
    expect(databaseMocks.getPlacementByEntityId).not.toHaveBeenCalled();
  });

  it("rejects an entity missing from the playthrough's game", async () => {
    databaseMocks.getEntityById.mockResolvedValue(null);

    await expect(
      getCurrentPlacement("playthrough-id", "unknown-entity"),
    ).rejects.toThrow("Entity not found in game: unknown-entity");

    expect(
      databaseMocks.getEntityById,
    ).toHaveBeenCalledWith("game-id", "unknown-entity");

    expect(databaseMocks.getPlacementOverride).not.toHaveBeenCalled();
    expect(databaseMocks.getPlacementByEntityId).not.toHaveBeenCalled();
  });
});