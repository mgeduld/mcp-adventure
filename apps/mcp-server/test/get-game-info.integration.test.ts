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

  it("returns the seeded game through MCP", async () => {
    const result = await client.callTool({
      name: "get_game_info",
      arguments: {
        slug: "forgotten-keep",
      },
    });

    expect(result.isError).not.toBe(true);

    expect(result.structuredContent).toMatchObject({
      found: true,
      game: {
        slug: "forgotten-keep",
        name: "The Forgotten Keep",
      },
    });
  });

  it("returns found false for an unknown game", async () => {
    const result = await client.callTool({
      name: "get_game_info",
      arguments: {
        slug: "nonexistent-game",
      },
    });

    expect(result.structuredContent).toEqual({
      found: false,
      game: null,
    });
  });
});