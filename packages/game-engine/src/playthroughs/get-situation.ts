import {
  getPlaythroughById,
  getEntityById,
} from "@mcp-adventure/database";

export type Situation = {
  playthroughId: string;
  room: {
    id: string;
    name: string;
    description: string | null;
  };
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

  return {
    playthroughId: playthrough.id,
    room: {
      id: room.id,
      name: room.name,
      description: room.description,
    },
  };
}