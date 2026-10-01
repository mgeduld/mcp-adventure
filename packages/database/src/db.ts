import "dotenv/config";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://mcp_adventure:mcp_adventure@localhost:5432/mcp_adventure";

export const db = new Pool({ connectionString });