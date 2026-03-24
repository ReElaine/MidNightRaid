const BOSS_CATALOG_PATH = "./data/wcl/bosses.json";

async function readJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`无法读取 JSON: ${path}`);
  }
  return response.json();
}

export async function loadBossCatalog() {
  return readJson(BOSS_CATALOG_PATH);
}

export function buildWclRankingsPath(bossSlug, difficulty = 4) {
  return `./data/wcl/rankings/${bossSlug}-d${difficulty}.json`;
}

export async function loadWclRankings(bossSlug, difficulty = 4) {
  return readJson(buildWclRankingsPath(bossSlug, difficulty));
}

export function buildWclTimelinePath(reportCode, fightId) {
  return `./data/wcl/timelines/${reportCode}-${fightId}.json`;
}

export async function loadWclTimeline(reportCode, fightId) {
  return readJson(buildWclTimelinePath(reportCode, fightId));
}
