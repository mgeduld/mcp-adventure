import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const packageDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);

config({ path: resolve(packageDirectory, "../../.env") });

export const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://mcp_adventure:mcp_adventure@localhost:5432/mcp_adventure";

