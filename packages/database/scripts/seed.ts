import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";
import { connectionString, packageDirectory } from "./config.js";

const { Client } = pg;

async function main(): Promise<void> {
  const seedsDirectory = resolve(packageDirectory, "seeds");
  const files = (await readdir(seedsDirectory))
    .filter((filename) => filename.endsWith(".sql"))
    .sort();
  const client = new Client({ connectionString });
  await client.connect();

  try {
    for (const filename of files) {
      console.log(`seeding ${filename}`);
      const sql = await readFile(resolve(seedsDirectory, filename), "utf8");
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }
    console.log("seeding complete");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

