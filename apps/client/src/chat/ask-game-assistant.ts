import type { Client } from "@modelcontextprotocol/client";
import {
  chatWithOllama,
  type OllamaMessage,
  type OllamaTool,
} from "../llm/ollama.js";

function parseArguments(
  args: Record<string, unknown> | string,
): Record<string, unknown> {
  if (typeof args === "string") {
    const parsed: unknown = JSON.parse(args);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error("Tool arguments must be a JSON object");
    }

    return parsed as Record<string, unknown>;
  }

  return args;
}

export async function askGameAssistant(
  mcpClient: Client,
  userMessage: string,
): Promise<string> {
  const { tools: mcpTools } = await mcpClient.listTools();

  const ollamaTools: OllamaTool[] = mcpTools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));

  const messages: OllamaMessage[] = [
    {
      role: "system",
      content: [
        "You are an assistant for a text-adventure application.",
        "Use the available tools whenever the user asks about a game.",
        "Do not invent game information.",
        "After receiving a tool result, answer the user briefly.",
      ].join(" "),
    },
    {
      role: "user",
      content: userMessage,
    },
  ];

  let modelTurns = 0;
  let toolHasBeenRequested = false; // has a tool been requested in any iteration of the while loop so far?
  const maximumModelTurns = 5; // let's make sure we don't have an infinitely-long conversation!

  while (true) {
    if (modelTurns >= maximumModelTurns) {
      throw new Error(
        `The model did not produce a final answer after ` +
          `${maximumModelTurns} turns`,
      );
    }

    modelTurns += 1;

    const assistantMessage = await chatWithOllama({
      messages,
      tools: ollamaTools,
    });

    // history sent back to model with each prompt
    messages.push(assistantMessage);

    const requestedToolCalls = assistantMessage.tool_calls ?? [];

    // Any tool-call requests this time through the while loop?
    if (requestedToolCalls.length === 0) {
      // Has a tool call ever been requested in a past iteration?
      if (!toolHasBeenRequested) {
        throw new Error(
          "Ollama answered without calling an MCP tool. " +
            "Confirm that the selected model supports tool calling.",
        );
      }

      // a tool-call has been requested in at least one past while-loop iteration,
      // but there's no request in this one, so we must be at the end. Meaning we
      // can return the final result.
      return assistantMessage.content;
    }

    toolHasBeenRequested = true;

    // Okay. We now know what tools the model wants to call. Let's call them.
    for (const toolCall of requestedToolCalls) {
      const toolResult = await mcpClient.callTool({
        name: toolCall.function.name,
        arguments: parseArguments(
          toolCall.function.arguments,
        ),
      });

      // history sent back to model with each prompt (now including tool-call result)
      messages.push({
        role: "tool",
        tool_name: toolCall.function.name,
        content: JSON.stringify(
          toolResult.structuredContent ??
            toolResult.content,
        ),
      });
    }
  }
}