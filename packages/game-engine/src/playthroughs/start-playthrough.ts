import {
  createHash,
  randomBytes,
} from "node:crypto";
import {
  createPlaythrough,
  getGameBySlug,
  type Playthrough,
} from "@mcp-adventure/database";

export type StartedPlaythrough = Playthrough & {
  resumeToken: string;
};

function generateResumeToken(): string {
  return randomBytes(24).toString("base64url");
}

function hashResumeToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function startPlaythrough(
  gameSlug: string,
): Promise<StartedPlaythrough> {
  const game = await getGameBySlug(gameSlug);

  if (!game) {
    throw new Error(
      `Game not found: ${gameSlug}`,
    );
  }

  if (!game.startingRoomId) {
    throw new Error(
      `Game has no starting room: ${gameSlug}`,
    );
  }

  const resumeToken = generateResumeToken();
  const resumeTokenHash = hashResumeToken(resumeToken);

  const playthrough = await createPlaythrough({
    gameId: game.id,
    currentRoomId: game.startingRoomId,
    resumeTokenHash,
  });

  return {
    ...playthrough,
    resumeToken,
  };
}