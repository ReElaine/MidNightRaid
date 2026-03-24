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

export function buildWclTimelinePath(reportCode, fightId) {
  return `./data/wcl/timelines/${reportCode}-${fightId}.json`;
}

export async function loadWclTimeline(reportCode, fightId) {
  return readJson(buildWclTimelinePath(reportCode, fightId));
}
