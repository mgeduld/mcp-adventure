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
  getEntityStateOverride: vi.fn(),
}));

vi.mock("@mcp-adventure/database", () => ({
  getPlaythroughById: databaseMocks.getPlaythroughById,
  getEntityById: databaseMocks.getEntityById,
  getEntityStateOverride: databaseMocks.getEntityStateOverride,
}));

import { getCurrentEntityState } from "./get-current-entity-state.js";

describe("getCurrentEntityState", () => {
  beforeEach(() => {
    databaseMocks.getPlaythroughById.mockReset();
    databaseMocks.getEntityById.mockReset();
    databaseMocks.getEntityStateOverride.mockReset();

    databaseMocks.getPlaythroughById.mockResolvedValue({
      id: "playthrough-id",
      gameId: "game-id",
    });

    databaseMocks.getEntityById.mockResolvedValue({
      id: "chest-id",
      initialState: { open: false, locked: false },
    });

    databaseMocks.getEntityStateOverride.mockResolvedValue(null);
  });

  it("returns initial state when no override exists", async () => {
    const state = await getCurrentEntityState(
      "playthrough-id",
      "chest-id",
    );

    expect(state).toEqual({ open: false, locked: false });

    expect(
      databaseMocks.getPlaythroughById,
    ).toHaveBeenCalledWith("playthrough-id", undefined);

    expect(
      databaseMocks.getEntityById,
    ).toHaveBeenCalledWith("game-id", "chest-id", undefined);

    expect(
      databaseMocks.getEntityStateOverride,
    ).toHaveBeenCalledWith("playthrough-id", "chest-id", undefined);
  });

  it("overrides saved fields and preserves other defaults", async () => {
    const initialState = { open: false, locked: false };
    const override = { open: true };

    databaseMocks.getEntityById.mockResolvedValue({
      id: "chest-id",
      initialState,
    });

    databaseMocks.getEntityStateOverride.mockResolvedValue(override);

    const state = await getCurrentEntityState(
      "playthrough-id",
      "chest-id",
    );

    expect(state).toEqual({ open: true, locked: false });

    // Reading current state must not mutate either stored input.
    expect(initialState).toEqual({ open: false, locked: false });
    expect(override).toEqual({ open: true });
  });

  it("allows false to override true", async () => {
    databaseMocks.getEntityById.mockResolvedValue({
      id: "chest-id",
      initialState: { open: true, locked: false },
    });

    databaseMocks.getEntityStateOverride.mockResolvedValue({
      open: false,
    });

    const state = await getCurrentEntityState(
      "playthrough-id",
      "chest-id",
    );

    expect(state).toEqual({ open: false, locked: false });
  });

  it("preserves defaults when the override is empty", async () => {
    databaseMocks.getEntityStateOverride.mockResolvedValue({});

    const state = await getCurrentEntityState(
      "playthrough-id",
      "chest-id",
    );

    expect(state).toEqual({ open: false, locked: false });
  });

  it("rejects an unknown playthrough", async () => {
    databaseMocks.getPlaythroughById.mockResolvedValue(null);

    await expect(
      getCurrentEntityState("unknown-id", "chest-id"),
    ).rejects.toThrow("Playthrough not found: unknown-id");

    expect(databaseMocks.getEntityById).not.toHaveBeenCalled();
    expect(
      databaseMocks.getEntityStateOverride,
    ).not.toHaveBeenCalled();
  });

  it("rejects an entity missing from the playthrough's game", async () => {
    databaseMocks.getEntityById.mockResolvedValue(null);

    await expect(
      getCurrentEntityState("playthrough-id", "unknown-entity"),
    ).rejects.toThrow(
      "Entity not found in game: unknown-entity",
    );

    expect(
      databaseMocks.getEntityStateOverride,
    ).not.toHaveBeenCalled();
  });
});