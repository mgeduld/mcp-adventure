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
import { db } from "@mcp-adventure/database";
import { startPlaythrough } from "@mcp-adventure/game-engine";

const projectDirectory = fileURLToPath(
  new URL("../", import.meta.url),
);

const client = new Client({
  name: "mcp-look-integration-test",
  version: "0.1.0",
});

describe("look MCP tool", () => {
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
    try {
      await client.close();
    } finally {
      await db.end();
    }
  });

  it("returns the starting room and hides the lantern inside the chest", async () => {
    const playthrough = await startPlaythrough("forgotten-keep");

    try {
      const result = await client.callTool({
        name: "look",
        arguments: {
          playthroughId: playthrough.id,
        },
      });

      expect(result.isError).not.toBe(true);

      expect(result.structuredContent).toEqual({
        playthroughId: playthrough.id,
        isLit: true,
        room: {
          id: "20000000-0000-0000-0000-000000000001",
          name: "Throne Room",
          description:
            "A faded throne faces tall doors and a scarred oak table.",
        },
        exits: [
          {
            connectionId: "40000000-0000-0000-0000-000000000001",
            direction: "west",
            destinationRoomId: "20000000-0000-0000-0000-000000000002",
            portalEntityId: null,
          },
        ],
        contents: [
          {
            id: "30000000-0000-0000-0000-000000000001",
            name: "oak table",
            description: "A heavy table whose surface is marked by age.",
            targetId: "20000000-0000-0000-0000-000000000001",
            relation: "in",
          },
          {
            id: "30000000-0000-0000-0000-000000000002",
            name: "iron chest",
            description: "A small iron-bound chest rests on the table.",
            targetId: "30000000-0000-0000-0000-000000000001",
            relation: "on",
          },
          {
            id: "30000000-0000-0000-0000-000000000004",
            name: "blue key",
            description: "A small key painted an improbable shade of blue.",
            targetId: "20000000-0000-0000-0000-000000000001",
            relation: "in",
          },
        ],
      });
    } finally {
      await db.query(
        "delete from playthroughs where id = $1",
        [playthrough.id],
      );
    }
  });
});