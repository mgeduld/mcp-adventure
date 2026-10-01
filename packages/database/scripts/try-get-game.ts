import { db, getGameBySlug } from "../src/index.js";

async function main() {
  const game = await getGameBySlug("forgotten-keep");
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