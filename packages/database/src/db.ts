import "dotenv/config";
import { Pool, type PoolClient } from "pg";

export type Queryable = Pool | PoolClient;

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://mcp_adventure:mcp_adventure@localhost:5432/mcp_adventure";

export const db = new Pool({ connectionString });