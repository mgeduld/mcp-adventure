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
  allowedToolNames?: readonly string[],
  activePlaythroughId?: string,
): Promise<string> {
  const { tools: mcpTools } = await mcpClient.listTools();

  const availableTools = allowedToolNames
    ? mcpTools.filter((tool) => allowedToolNames.includes(tool.name))
    : mcpTools;

  const ollamaTools: OllamaTool[] = availableTools.map((tool) => ({
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
        "Continue calling tools until the player's request is completed or cannot be completed.",
        "Looking up facts is a prerequisite, not completion of a requested action.",
        "Then answer the user briefly using the tool results.",
        ...(activePlaythroughId
          ? [
            `The active playthrough ID is "${activePlaythroughId}".`,
            "A fresh look result is supplied before your first response.",
            "Use its exact entity IDs when requesting actions.",
            "For a request to take an object, call take; describing the room alone does not complete that request.",
            "Never claim an object was taken without a successful take result.", "Never invent entity IDs.",
            "Only perform actions requested by the player.",
            "Report tool failures honestly; do not claim an action succeeded.",
            "Match each contents item's targetId to room.id or another item's id.",
            "Array order does not indicate containment.",
            "An exit with portalEntityId null has no door.",
            "Do not infer exit doors from room descriptions.",
            "If isLit is false, describe darkness without inventing details.",
          ]
          : []),
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

  if (
    activePlaythroughId !== undefined &&
    availableTools.some((tool) => tool.name === "look")
  ) {
    const argumentsForLook = {
      playthroughId: activePlaythroughId,
    };

    const initialLook = await mcpClient.callTool({
      name: "look",
      arguments: argumentsForLook,
    });

    if (initialLook.isError) {
      throw new Error(
        "Could not read the current situation: " +
        JSON.stringify(initialLook.content),
      );
    }

    messages.push(
      {
        role: "assistant",
        content: "",
        tool_calls: [
          {
            function: {
              name: "look",
              arguments: argumentsForLook,
            },
          },
        ],
      },
      {
        role: "tool",
        tool_name: "look",
        content: JSON.stringify(
          initialLook.structuredContent ?? initialLook.content,
        ),
      },
    );

    toolHasBeenRequested = true;
  }

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
      if (
        !ollamaTools.some(
          (tool) => tool.function.name === toolCall.function.name,
        )
      ) {
        throw new Error(
          `Tool is not available for this request: ${toolCall.function.name}`,
        );
      }

      const parsedArguments = parseArguments(
        toolCall.function.arguments,
      );

      const toolResult = await mcpClient.callTool({
        name: toolCall.function.name,
        arguments: activePlaythroughId
          ? {
            ...parsedArguments,
            playthroughId: activePlaythroughId,
          }
          : parsedArguments,
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