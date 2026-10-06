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
import {
  db,
  getInventoryEntityIds,
} from "@mcp-adventure/database";
import { startPlaythrough } from "@mcp-adventure/game-engine";

const projectDirectory = fileURLToPath(
  new URL("../", import.meta.url),
);

const client = new Client({
  name: "mcp-take-integration-test",
  version: "0.1.0",
});

const keyId = "30000000-0000-0000-0000-000000000004";

describe("take MCP tool", () => {
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

  it("takes the blue key and handles a repeated request", async () => {
    const playthrough = await startPlaythrough("forgotten-keep");

    try {
      const request = {
        name: "take",
        arguments: {
          playthroughId: playthrough.id,
          entityId: keyId,
        },
      };

      const first = await client.callTool(request);

      expect(first.isError).not.toBe(true);
      expect(first.structuredContent).toEqual({
        entityId: keyId,
        name: "blue key",
        status: "taken",
      });

      expect(
        await getInventoryEntityIds(playthrough.id),
      ).toEqual([keyId]);

      const repeated = await client.callTool(request);

      expect(repeated.isError).not.toBe(true);
      expect(repeated.structuredContent).toEqual({
        entityId: keyId,
        name: "blue key",
        status: "already_carried",
      });
    } finally {
      await db.query(
        "delete from playthroughs where id = $1",
        [playthrough.id],
      );
    }
  });
});