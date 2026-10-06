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

  it("rejects a tool that is not allowed for the request", async () => {
    ollamaMocks.chatWithOllama.mockResolvedValue({
      role: "assistant",
      content: "",
      tool_calls: [
        {
          function: {
            name: "start_game",
            arguments: { gameSlug: "forgotten-keep" },
          },
        },
      ],
    });

    const mcpClient = createMcpClient();

    await expect(
      askGameAssistant(
        mcpClient,
        "Get game information.",
        ["get_game_info"],
      ),
    ).rejects.toThrow(
      "Tool is not available for this request: start_game",
    );

    expect(mcpClient.callTool).not.toHaveBeenCalled();
  });

  it("binds tool calls to the active playthrough", async () => {
    const callTool = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "{}" }],
      structuredContent: {},
    });

    const mcpClient = {
      listTools: vi.fn().mockResolvedValue({
        tools: [
          {
            name: "look",
            inputSchema: {
              type: "object",
              properties: {
                playthroughId: { type: "string" },
              },
              required: ["playthroughId"],
            },
          },
        ],
      }),
      callTool,
    } as unknown as Client;

    ollamaMocks.chatWithOllama
      .mockResolvedValueOnce({
        role: "assistant",
        content: "",
        tool_calls: [
          {
            function: {
              name: "look",
              arguments: {
                playthroughId: "model-generated-id",
              },
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        role: "assistant",
        content: "You are in the Throne Room.",
      });

    await askGameAssistant(
      mcpClient,
      "Look around.",
      ["look"],
      "active-playthrough-id",
    );

    expect(callTool).toHaveBeenCalledWith({
      name: "look",
      arguments: {
        playthroughId: "active-playthrough-id",
      },
    });
  });

  it("offers take only after receiving a successful look result", async () => {
    const keyId = "30000000-0000-0000-0000-000000000004";

    const callTool = vi.fn()
      .mockResolvedValueOnce({
        content: [],
        structuredContent: {
          contents: [{ id: keyId, name: "blue key" }],
        },
      })
      .mockResolvedValueOnce({
        content: [],
        structuredContent: {
          entityId: keyId,
          name: "blue key",
          status: "taken",
        },
      });

    const mcpClient = {
      listTools: vi.fn().mockResolvedValue({
        tools: ["look", "take"].map((name) => ({
          name,
          inputSchema: { type: "object", properties: {} },
        })),
      }),
      callTool,
    } as unknown as Client;

    ollamaMocks.chatWithOllama
      .mockResolvedValueOnce({
        role: "assistant",
        content: "",
        tool_calls: [
          {
            function: {
              name: "look",
              arguments: {},
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        role: "assistant",
        content: "",
        tool_calls: [
          {
            function: {
              name: "take",
              arguments: { entityId: keyId },
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        role: "assistant",
        content: "You take the blue key.",
      });

    const answer = await askGameAssistant(
      mcpClient,
      "Take the blue key.",
      ["look", "take"],
      "active-playthrough-id",
    );

    const firstTools =
      ollamaMocks.chatWithOllama.mock.calls[0]?.[0].tools;
    const secondTools =
      ollamaMocks.chatWithOllama.mock.calls[1]?.[0].tools;

    expect(firstTools.map(
      (tool: { function: { name: string } }) => tool.function.name,
    )).toEqual(["look"]);

    expect(secondTools.map(
      (tool: { function: { name: string } }) => tool.function.name,
    )).toEqual(["look", "take"]);

    expect(callTool).toHaveBeenNthCalledWith(2, {
      name: "take",
      arguments: {
        entityId: keyId,
        playthroughId: "active-playthrough-id",
      },
    });

    expect(answer).toBe("You take the blue key.");
  });
});