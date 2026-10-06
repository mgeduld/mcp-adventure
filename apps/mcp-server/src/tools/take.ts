import type { McpServer } from "@modelcontextprotocol/server";
import { takeEntity } from "@mcp-adventure/game-engine";
import * as z from "zod/v4";

export function registerTakeTool(server: McpServer): void {
  server.registerTool(
    "take",
    {
      title: "Take an Object",
      description:
        "Take a visible, reachable, portable object into inventory. " +
        "Use look to find its entity ID; do not invent IDs. " +
        "Returns taken or already_carried.",
      inputSchema: z.object({
        playthroughId: z.uuid().describe(
          "The active playthrough ID.",
        ),
        entityId: z.guid().describe(
          "The object's ID from look.",
        ),
      }),
    },
    async ({ playthroughId, entityId }) => {
      const result = await takeEntity(playthroughId, entityId);

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