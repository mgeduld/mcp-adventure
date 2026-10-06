import { fileURLToPath } from "node:url";
import express, {
  type ErrorRequestHandler,
} from "express";
import { askGameAssistant } from "./chat/ask-game-assistant.js";
import { connectToGameServer } from "./mcp/client.js";
import { startGame } from "./game/start-game.js";

const port = Number(process.env.PORT ?? 3000);

const publicDirectory = fileURLToPath(
  new URL("../public", import.meta.url),
);

const mcpClient = await connectToGameServer();

const app = express();

app.use(express.static(publicDirectory));

app.post("/api/demo", async (_request, response, next) => {
  try {
    const answer = await askGameAssistant(
      mcpClient,
      'Get information about the game whose slug is "forgotten-keep".',
    );

    response.json({ answer });
  } catch (error) {
    next(error);
  }
});

const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  console.error(error);

  response.status(500).json({
    error:
      error instanceof Error
        ? error.message
        : "An unexpected error occurred",
  });
};

app.post("/api/game/start", async (_request, response, next) => {
  try {
    const game = await startGame(mcpClient, "forgotten-keep");

    response.status(201).json(game);
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);

const httpServer = app.listen(port, () => {
  console.log(`Client running at http://localhost:${port}`);
});

let shuttingDown = false;

async function shutdown(): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log("\nShutting down...");

  httpServer.close();
  await mcpClient.close();
}

process.once("SIGINT", () => {
  void shutdown();
});

process.once("SIGTERM", () => {
  void shutdown();
});