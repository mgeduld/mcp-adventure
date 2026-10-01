import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";
import { connectionString, packageDirectory } from "./config.js";

const { Client } = pg;
const migrationsDirectory = resolve(packageDirectory, "migrations");

type AppliedMigration = {
  filename: string;
  checksum: string;
  applied_at: Date;
};

async function getMigrationFiles(): Promise<string[]> {
  return (await readdir(migrationsDirectory))
    .filter((filename) => filename.endsWith(".sql"))
    .sort();
}

function checksum(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

async function main(): Promise<void> {
  const showStatus = process.argv.includes("--status");
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      create table if not exists schema_migrations (
        filename text primary key,
        checksum text not null,
        applied_at timestamptz not null default now()
      )
    `);

    const files = await getMigrationFiles();
    const result = await client.query<AppliedMigration>(
      "select filename, checksum, applied_at from schema_migrations order by filename",
    );
    const applied = new Map(result.rows.map((row) => [row.filename, row]));

    for (const filename of files) {
      const sql = await readFile(resolve(migrationsDirectory, filename), "utf8");
      const currentChecksum = checksum(sql);
      const previous = applied.get(filename);

      if (previous && previous.checksum !== currentChecksum) {
        throw new Error(
          `Migration ${filename} was changed after it was applied. Create a new migration instead.`,
        );
      }

      if (showStatus) {
        console.log(`${previous ? "applied" : "pending"}  ${filename}`);
        continue;
      }

      if (previous) continue;

      console.log(`applying ${filename}`);
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query(
          "insert into schema_migrations (filename, checksum) values ($1, $2)",
          [filename, currentChecksum],
        );
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }

    if (!showStatus) console.log("migrations complete");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

