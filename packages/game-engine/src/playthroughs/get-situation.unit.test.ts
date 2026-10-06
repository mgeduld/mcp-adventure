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
    getExitsByRoomId: vi.fn(),
}));

const contentsMocks = vi.hoisted(() => ({
    getVisibleRoomContents: vi.fn(),
}));

vi.mock("@mcp-adventure/database", () => ({
    getPlaythroughById: databaseMocks.getPlaythroughById,
    getEntityById: databaseMocks.getEntityById,
    getExitsByRoomId: databaseMocks.getExitsByRoomId,
}));

vi.mock("./get-visible-room-contents.js", () => ({
    getVisibleRoomContents: contentsMocks.getVisibleRoomContents,
}));

import { getSituation } from "./get-situation.js";

describe("getSituation", () => {
    beforeEach(() => {
        databaseMocks.getPlaythroughById.mockReset();
        databaseMocks.getEntityById.mockReset();
        databaseMocks.getExitsByRoomId.mockReset();

        databaseMocks.getExitsByRoomId.mockResolvedValue([]);

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

        contentsMocks.getVisibleRoomContents.mockReset();
        contentsMocks.getVisibleRoomContents.mockResolvedValue([]);
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
            exits: [],
            contents: [],
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

    it("includes exits from the playthrough's current room", async () => {
        const exits = [
            {
                connectionId: "hall-connection-id",
                direction: "west",
                destinationRoomId: "west-hall-id",
                portalEntityId: null,
            },
            {
                connectionId: "door-connection-id",
                direction: "north",
                destinationRoomId: "other-room-id",
                portalEntityId: "door-id",
            },
        ];

        databaseMocks.getExitsByRoomId.mockResolvedValue(exits);

        const situation = await getSituation("playthrough-id");

        expect(
            databaseMocks.getExitsByRoomId,
        ).toHaveBeenCalledWith("game-id", "throne-room-id");

        expect(situation.exits).toEqual(exits);
    });

    it("includes the visible room contents", async () => {
        const contents = [
            {
                id: "chest-id",
                name: "iron chest",
                description: "An iron-bound chest.",
                targetId: "table-id",
                relation: "on",
            },
        ];

        contentsMocks.getVisibleRoomContents.mockResolvedValue(contents);

        const situation = await getSituation("playthrough-id");

        expect(
            contentsMocks.getVisibleRoomContents,
        ).toHaveBeenCalledWith("playthrough-id");

        expect(situation.contents).toEqual(contents);
    });
});