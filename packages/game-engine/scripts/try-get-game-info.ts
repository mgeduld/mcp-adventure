import { db } from "@mcp-adventure/database";
import { getGameInfo } from "../src/index.js";

const slug = process.argv[2] ?? "forgotten-keep";

async function main() {
  const game = await getGameInfo(slug);

  if (!game) {
    console.log(`No game found with slug: ${slug}`);
    return;
  }

  console.log(game);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });