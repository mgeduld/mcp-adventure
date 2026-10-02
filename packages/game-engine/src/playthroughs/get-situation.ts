import {
  getPlaythroughById,
  getEntityById,
  getExitsByRoomId,
  type RoomExit,
} from "@mcp-adventure/database";

export type Situation = {
  playthroughId: string;
  room: {
    id: string;
    name: string;
    description: string | null;
  };
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

  const exits = await getExitsByRoomId(
    playthrough.gameId,
    room.id,
  );

  return {
    playthroughId: playthrough.id,
    room: {
      id: room.id,
      name: room.name,
      description: room.description,
    },
    exits,
  };
}