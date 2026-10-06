import type { Client } from "@modelcontextprotocol/client";

export type StartedGame = {
  playthroughId: string;
  currentRoomId: string;
  resumeToken: string;
};

export async function startGame(
  mcpClient: Client,
  gameSlug: string,
): Promise<StartedGame> {
  const result = await mcpClient.callTool({
    name: "start_game",
    arguments: { gameSlug },
  });

  if (result.isError) {
    throw new Error("start_game failed");
  }

  const textContent = result.content.find(
    (item) => item.type === "text",
  );

  if (!textContent || textContent.type !== "text") {
    throw new Error("start_game returned no text result");
  }

  const data: unknown = JSON.parse(textContent.text);

  if (
    typeof data !== "object" ||
    data === null ||
    Array.isArray(data) ||
    !("playthroughId" in data) ||
    typeof data.playthroughId !== "string" ||
    data.playthroughId.length === 0 ||
    !("currentRoomId" in data) ||
    typeof data.currentRoomId !== "string" ||
    data.currentRoomId.length === 0 ||
    !("resumeToken" in data) ||
    typeof data.resumeToken !== "string" ||
    data.resumeToken.length === 0
  ) {
    throw new Error("start_game returned an invalid result");
  }

  return {
    playthroughId: data.playthroughId,
    currentRoomId: data.currentRoomId,
    resumeToken: data.resumeToken,
  };
}