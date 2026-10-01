import { askGameAssistant } from "../src/chat/ask-game-assistant.js"
import { connectToGameServer } from "../src/mcp/client.js"

const mcpClient = await connectToGameServer();

try {
  const answer = await askGameAssistant(
    mcpClient,
    'Get information about the game whose slug is "forgotten-keep".',
  );

  console.log("\nFinal answer:\n");
  console.log(answer);
} finally {
  await mcpClient.close();
}