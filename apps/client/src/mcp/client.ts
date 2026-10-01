import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

export async function connectToGameServer(): Promise<Client> {
  const serverEntry = fileURLToPath(
    new URL("../../../mcp-server/src/index.ts", import.meta.url),
  );

  const envFile = fileURLToPath(
    new URL("../../../../.env", import.meta.url),
  );

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      `--env-file=${envFile}`,
      "--import",
      "tsx",
      serverEntry,
    ],
  });

  const client = new Client({
    name: "mcp-adventure-client",
    version: "0.1.0",
  });

  await client.connect(transport);

  return client;
}