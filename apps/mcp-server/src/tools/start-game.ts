import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import { startPlaythrough } from "@mcp-adventure/game-engine";

export function registerStartGameTool(server: McpServer): void {
  server.registerTool(
    "start_game",
    {
      description: "Starts a new playthrough of a game",
      inputSchema: z.object({
        gameSlug: z.string().min(1),
      }),
    },
    async ({ gameSlug }) => {
      const playthrough = await startPlaythrough(gameSlug);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              playthroughId: playthrough.id,
              currentRoomId: playthrough.currentRoomId,
              resumeToken: playthrough.resumeToken,
            }),
          },
        ],
      };
    },
  );
}