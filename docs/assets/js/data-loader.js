const BOSS_CATALOG_PATH = "./data/wcl/bosses.json";

async function readJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`无法读取 JSON: ${path}`);
  }
  return response.json();
}

function sanitizeFilePart(value, fallback) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

export async function loadBossCatalog() {
  return readJson(BOSS_CATALOG_PATH);
}

export function buildWclStudyPath(bossSlug, difficulty = 4, className = "Mage", specName = "Fire", metric = "dps") {
  const classPart = sanitizeFilePart(className, "all-classes");
  const specPart = sanitizeFilePart(specName, "all-specs");
  const metricPart = sanitizeFilePart(metric, "dps");
  return `./data/wcl/studies/${bossSlug}-d${difficulty}-${classPart}-${specPart}-${metricPart}.json`;
}

export async function loadWclStudy(bossSlug, difficulty = 4, className = "Mage", specName = "Fire", metric = "dps") {
  return readJson(buildWclStudyPath(bossSlug, difficulty, className, specName, metric));
}
