import type { McpServer } from "@modelcontextprotocol/server";
import { getSituation } from "@mcp-adventure/game-engine";
import * as z from "zod/v4";

export function registerLookTool(server: McpServer): void {
  server.registerTool(
    "look",
    {
      title: "Look Around",
      description:
        "Get the current room, lighting, visible contents, and exits " +
        "for an existing playthrough. When isLit is false, " +
        "describe darkness without inventing hidden details.",
      inputSchema: z.object({
        playthroughId: z.uuid().describe(
          "The playthrough ID returned by start_game.",
        ),
      }),
    },
    async ({ playthroughId }) => {
      const situation = await getSituation(playthroughId);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(situation),
          },
        ],
        structuredContent: situation,
      };
    },
  );
}