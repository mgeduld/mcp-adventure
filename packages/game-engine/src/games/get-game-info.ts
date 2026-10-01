import { getGameBySlug } from "@mcp-adventure/database";

export type GameInfo = {
  slug: string;
  name: string;
  description: string | null;
};

export async function getGameInfo(
  slug: string,
): Promise<GameInfo | null> {
  const game = await getGameBySlug(slug);

  if (!game) {
    return null;
  }

  return {
    slug: game.slug,
    name: game.name,
    description: game.description,
  };
}