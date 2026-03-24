const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const docsRoot = path.join(repoRoot, "docs");
const dataRoot = path.join(docsRoot, "data", "wcl");
const bossCatalogPath = path.join(dataRoot, "bosses.json");
const uiConfigPath = path.join(dataRoot, "ui-config.json");
const rankingsRoot = path.join(dataRoot, "rankings");
const timelinesRoot = path.join(dataRoot, "timelines");
const studiesRoot = path.join(dataRoot, "studies");

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function validateBossCatalog() {
  assert(fs.existsSync(bossCatalogPath), "Missing docs/data/wcl/bosses.json");
  const catalog = readJson(bossCatalogPath);
  assert(Array.isArray(catalog.bosses) && catalog.bosses.length > 0, "bosses.json must contain a non-empty bosses array");
}

function validateUiConfig() {
  assert(fs.existsSync(uiConfigPath), "Missing docs/data/wcl/ui-config.json");
  const config = readJson(uiConfigPath);
  assert(Array.isArray(config.classProfiles) && config.classProfiles.length > 0, "ui-config.json must contain a non-empty classProfiles array");
}

function validateRankingsFiles() {
  if (!fs.existsSync(rankingsRoot)) {
    return;
  }

  const files = fs.readdirSync(rankingsRoot).filter((name) => name.endsWith(".json"));
  for (const file of files) {
    const data = readJson(path.join(rankingsRoot, file));
    ["encounterId", "bossName", "difficulty", "rankings"].forEach((field) => {
      assert(data[field] !== undefined && data[field] !== null, `${file} is missing ${field}`);
    });
    assert(Array.isArray(data.rankings), `${file} rankings must be an array`);
  }
}

function validateTimelineFiles() {
  if (!fs.existsSync(timelinesRoot)) {
    return;
  }

  const files = fs.readdirSync(timelinesRoot).filter((name) => name.endsWith(".json"));
  for (const file of files) {
    const data = readJson(path.join(timelinesRoot, file));
    ["reportCode", "fightId", "bossName", "timeline"].forEach((field) => {
      assert(data[field] !== undefined && data[field] !== null, `${file} is missing ${field}`);
    });
    assert(Array.isArray(data.timeline), `${file} timeline must be an array`);
  }
}

function validateStudyFiles() {
  if (!fs.existsSync(studiesRoot)) {
    return;
  }

  const files = fs.readdirSync(studiesRoot).filter((name) => name.endsWith(".json"));
  for (const file of files) {
    const data = readJson(path.join(studiesRoot, file));
    ["bossSlug", "bossName", "difficulty", "className", "metric", "samples", "bossTrack", "classTrack", "timelineRows"].forEach((field) => {
      assert(data[field] !== undefined && data[field] !== null, `${file} is missing ${field}`);
    });
    assert(Array.isArray(data.samples), `${file} samples must be an array`);
    assert(Array.isArray(data.bossTrack), `${file} bossTrack must be an array`);
    assert(Array.isArray(data.classTrack), `${file} classTrack must be an array`);
    assert(Array.isArray(data.timelineRows), `${file} timelineRows must be an array`);
  }
}

function main() {
  validateBossCatalog();
  validateUiConfig();
  validateRankingsFiles();
  validateTimelineFiles();
  validateStudyFiles();

  if (!process.exitCode) {
    console.log("JSON validation passed.");
  }
}

main();
