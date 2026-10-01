import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const client = new Client({
  name: "mcp-adventure-test-client",
  version: "0.1.0",
});

const transport = new StdioClientTransport({
  command: "node",
  args: [
    "--env-file=../../.env",
    "--import",
    "tsx",
    "src/index.ts",
  ],
});

async function main(): Promise<void> {
  await client.connect(transport);

  const { tools } = await client.listTools();

  console.log("Available tools:");

  for (const tool of tools) {
    console.log(`- ${tool.name}: ${tool.description}`);
  }

  const result = await client.callTool({
    name: "get_game_info",
    arguments: {
      slug: "forgotten-keep",
    },
  });

  console.log("\nTool result:");
  console.dir(result, { depth: null });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.close();
  });