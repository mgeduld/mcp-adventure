import pg from "pg";
import { setTimeout } from "node:timers/promises";
import { connectionString } from "./config.js";

const { Client } = pg;
const maximumAttempts = 30;

async function main(): Promise<void> {
  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    const client = new Client({ connectionString });
    try {
      await client.connect();
      await client.query("select 1");
      await client.end();
      console.log("PostgreSQL is ready");
      return;
    } catch {
      await client.end().catch(() => undefined);
      if (attempt === maximumAttempts) break;
      console.log(`waiting for PostgreSQL (${attempt}/${maximumAttempts})`);
      await setTimeout(1000);
    }
  }

  throw new Error("PostgreSQL did not become ready within 30 seconds");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

