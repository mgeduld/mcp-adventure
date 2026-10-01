import type { Client } from "@modelcontextprotocol/client";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const ollamaMocks = vi.hoisted(() => ({
  chatWithOllama: vi.fn(),
}));

vi.mock("../llm/ollama.js", () => ({
  chatWithOllama: ollamaMocks.chatWithOllama,
}));

import { askGameAssistant } from "./ask-game-assistant.js";

function createMcpClient() {
  return {
    listTools: vi.fn().mockResolvedValue({
      tools: [
        {
          name: "get_game_info",
          description: "Get information about a game.",
          inputSchema: {
            type: "object",
            properties: {
              slug: {
                type: "string",
              },
            },
            required: ["slug"],
          },
        },
      ],
    }),

    callTool: vi.fn().mockResolvedValue({
      content: [
        {
          type: "text",
          text: '{"found":true}',
        },
      ],
      structuredContent: {
        found: true,
        game: {
          slug: "forgotten-keep",
          name: "The Forgotten Keep",
          description: "A demonstration game.",
        },
      },
    }),
  } as unknown as Client;
}

describe("askGameAssistant", () => {
  beforeEach(() => {
    ollamaMocks.chatWithOllama.mockReset();
  });

  it("executes a requested MCP tool and returns the final answer", async () => {
    ollamaMocks.chatWithOllama
      .mockResolvedValueOnce({
        role: "assistant",
        content: "",
        tool_calls: [
          {
            function: {
              name: "get_game_info",
              arguments: {
                slug: "forgotten-keep",
              },
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        role: "assistant",
        content:
          "The Forgotten Keep is a demonstration game.",
      });

    const mcpClient = createMcpClient();

    const answer = await askGameAssistant(
      mcpClient,
      "Tell me about forgotten-keep.",
    );

    expect(mcpClient.callTool).toHaveBeenCalledWith({
      name: "get_game_info",
      arguments: {
        slug: "forgotten-keep",
      },
    });

    expect(
      ollamaMocks.chatWithOllama,
    ).toHaveBeenCalledTimes(2);

    expect(answer).toBe(
      "The Forgotten Keep is a demonstration game.",
    );
  });

  it("rejects an answer that bypasses MCP", async () => {
    ollamaMocks.chatWithOllama.mockResolvedValue({
      role: "assistant",
      content: "I already know about that game.",
    });

    const mcpClient = createMcpClient();

    await expect(
      askGameAssistant(
        mcpClient,
        "Tell me about forgotten-keep.",
      ),
    ).rejects.toThrow(
      "Ollama answered without calling an MCP tool. Confirm that the selected model supports tool calling.",
    );

    expect(mcpClient.callTool).not.toHaveBeenCalled();
  });
});