import pg from "pg";
import { connectionString } from "./config.js";

const { Client } = pg;

async function main(): Promise<void> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    console.log("dropping and recreating the public schema");
    await client.query("drop schema public cascade; create schema public;");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
