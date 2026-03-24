const BOSS_CATALOG_PATH = "./data/wcl/bosses.json";
const UI_CONFIG_PATH = "./data/wcl/ui-config.json";

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

export async function loadUiConfig() {
  return readJson(UI_CONFIG_PATH);
}

export function buildWclStudyPath(bossSlug, difficulty = 4, className = "Priest", specName = "Holy", metric = "hps") {
  const classPart = sanitizeFilePart(className, "all-classes");
  const specPart = sanitizeFilePart(specName, "all-specs");
  const metricPart = sanitizeFilePart(metric, "hps");
  return `./data/wcl/studies/${bossSlug}-d${difficulty}-${classPart}-${specPart}-${metricPart}.json`;
}

export async function loadWclStudy(bossSlug, difficulty = 4, className = "Priest", specName = "Holy", metric = "hps") {
  return readJson(buildWclStudyPath(bossSlug, difficulty, className, specName, metric));
}
