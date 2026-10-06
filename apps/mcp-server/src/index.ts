import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { registerGetGameInfoTool } from "./tools/get-game-info.js";
import { registerStartGameTool } from "./tools/start-game.js";
import { registerLookTool } from "./tools/look.js";

function createServer(): McpServer {
  const server = new McpServer({
    name: "mcp-adventure",
    version: "0.1.0",
  });

  registerGetGameInfoTool(server);
  registerStartGameTool(server);
  registerLookTool(server);

  return server;
}

void serveStdio(createServer);

// stdio transport uses stdout, so we can't log to the console with console.log()
console.error("MCP Adventure server running on stdio");