import type { Client } from "@modelcontextprotocol/client";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { startGame } from "./start-game.js";

function createClient(result: unknown) {
  const callTool = vi.fn().mockResolvedValue(result);

  return {
    client: { callTool } as unknown as Client,
    callTool,
  };
}

describe("startGame", () => {
  it("calls start_game and returns the playthrough identity", async () => {
    const identity = {
      playthroughId: "playthrough-id",
      currentRoomId: "room-id",
      resumeToken: "resume-token",
    };

    const { client, callTool } = createClient({
      content: [
        {
          type: "text",
          text: JSON.stringify(identity),
        },
      ],
    });

    expect(
      await startGame(client, "forgotten-keep"),
    ).toEqual(identity);

    expect(callTool).toHaveBeenCalledWith({
      name: "start_game",
      arguments: { gameSlug: "forgotten-keep" },
    });
  });

  it("rejects an MCP tool error", async () => {
    const { client } = createClient({
      isError: true,
      content: [{ type: "text", text: "Game not found" }],
    });

    await expect(
      startGame(client, "unknown-game"),
    ).rejects.toThrow("start_game failed");
  });

  it("rejects a result without text content", async () => {
    const { client } = createClient({ content: [] });

    await expect(
      startGame(client, "forgotten-keep"),
    ).rejects.toThrow("start_game returned no text result");
  });

  it.each([
    null,
    [],
    {},
    {
      playthroughId: "playthrough-id",
      currentRoomId: "room-id",
    },
    {
      playthroughId: "playthrough-id",
      currentRoomId: "room-id",
      resumeToken: 123,
    },
    {
      playthroughId: "",
      currentRoomId: "room-id",
      resumeToken: "resume-token",
    },
  ])("rejects an invalid identity: %j", async (data) => {
    const { client } = createClient({
      content: [
        {
          type: "text",
          text: JSON.stringify(data),
        },
      ],
    });

    await expect(
      startGame(client, "forgotten-keep"),
    ).rejects.toThrow("start_game returned an invalid result");
  });
});