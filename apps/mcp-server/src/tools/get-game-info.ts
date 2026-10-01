import type { McpServer } from "@modelcontextprotocol/server";
import { getGameInfo } from "@mcp-adventure/game-engine";
import * as z from "zod/v4";

export function registerGetGameInfoTool(server: McpServer): void {
  server.registerTool(
    "get_game_info",
    {
      title: "Get Game Information",
      description:
        "Get basic information about a game using its unique slug.",
      inputSchema: z.object({
        slug: z
          .string()
          .min(1)
          .describe(
            'The unique game slug, such as "forgotten-keep".',
          ),
      }),
    },
    async ({ slug }) => {
      const game = await getGameInfo(slug);

      const result = game
        ? {
            found: true,
            game,
          }
        : {
            found: false,
            game: null,
          };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
        structuredContent: result,
      };
    },
  );
}