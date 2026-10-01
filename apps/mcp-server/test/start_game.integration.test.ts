import { fileURLToPath } from "node:url";

import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from "vitest";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const projectDirectory = fileURLToPath(
  new URL("../", import.meta.url),
);

const client = new Client({
    name: "mcp-integration-test",
    version: "0.1.0",
});

import { db } from "@mcp-adventure/database";

describe("get_game_info MCP tool", () => {
    beforeAll(async () => {
        const transport = new StdioClientTransport({
            command: process.execPath,
            args: [
                "--env-file=../../.env",
                "--import",
                "tsx",
                "src/index.ts",
            ],
            cwd: projectDirectory,
        });

        await client.connect(transport);
    });

    afterAll(async () => {
        await client.close();
    });

    it("starts a playthrough of the seeded game", async () => {
        let createdPlaythroughId: string | undefined;

        try {
            const result = await client.callTool({
                name: "start_game",
                arguments: {
                    gameSlug: "forgotten-keep",
                },
            });

            expect(result.isError).not.toBe(true);

            const textContent = result.content.find(
                (item) => item.type === "text",
            );

            if (!textContent || textContent.type !== "text") {
                throw new Error("Expected start_game to return text content");
            }

            const data = JSON.parse(textContent.text) as {
                playthroughId: string;
                currentRoomId: string;
                resumeToken: string;
            };

            createdPlaythroughId = data.playthroughId;

            expect(data.playthroughId).toEqual(expect.any(String));
            expect(data.resumeToken).toEqual(expect.any(String));

            expect(data.currentRoomId).toBe(
                "20000000-0000-0000-0000-000000000001",
            );
        } finally {
            if (createdPlaythroughId) {
                await db.query(
                    `delete from playthroughs where id = $1`,
                    [createdPlaythroughId],
                );
            }
        }
    })
});
