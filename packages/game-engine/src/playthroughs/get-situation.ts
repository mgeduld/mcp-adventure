import {
    getPlaythroughById,
    getEntityById,
    getExitsByRoomId,
    type RoomExit,
} from "@mcp-adventure/database";

import {
    getVisibleRoomContents,
    type VisibleRoomEntity,
} from "./get-visible-room-contents.js";

import { isCurrentRoomLit } from "./is-current-room-lit.js";

export type Situation = {
    playthroughId: string;
    room: {
        id: string;
        name: string;
        description: string | null;
    };
    isLit: boolean;
    contents: VisibleRoomEntity[];
    exits: RoomExit[];
};

export async function getSituation(
    playthroughId: string,
): Promise<Situation> {
    const playthrough = await getPlaythroughById(playthroughId);

    if (!playthrough) {
        throw new Error(`Playthrough not found: ${playthroughId}`);
    }

    const room = await getEntityById(
        playthrough.gameId,
        playthrough.currentRoomId,
    );

    if (!room || room.kind !== "room") {
        throw new Error(
            `Current room not found: ${playthrough.currentRoomId}`,
        );
    }

    const isLit = await isCurrentRoomLit(playthroughId);

    const exits = isLit
        ? await getExitsByRoomId(playthrough.gameId, room.id)
        : [];

    const contents = isLit
        ? await getVisibleRoomContents(playthroughId)
        : [];

    return {
        playthroughId: playthrough.id,
        isLit,
        room: {
            id: room.id,
            name: room.name,
            description: isLit ? room.description : null,
        },
        exits,
        contents,
    };
}