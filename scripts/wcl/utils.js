const fs = require("fs");
const path = require("path");
const { BOSS_MAPPING_PATH, ENV_PATH, FETCH_POLICY_PATH, TIMELINE_FILTERS_PATH, TIMELINE_PRESETS_PATH } = require("./config");

let envLoaded = false;
let cachedBossMapping = null;
let cachedTimelineFilters = null;
let cachedFetchPolicy = null;
let cachedTimelinePresets = null;

function loadEnvFile(filePath = ENV_PATH) {
  if (envLoaded || !fs.existsSync(filePath)) {
    envLoaded = true;
    return;
  }

  const content = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 0) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });

  envLoaded = true;
}

function requireV2Credentials() {
  loadEnvFile();

  const clientId = process.env.WCL_V2_CLIENT_ID;
  const clientSecret = process.env.WCL_V2_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing WCL_V2_CLIENT_ID or WCL_V2_CLIENT_SECRET. Copy .env.example to .env and fill both values first.");
  }

  return { clientId, clientSecret };
}

function extractReportCode(input) {
  if (!input || typeof input !== "string") {
    throw new Error("Please provide a report code or full WCL report URL.");
  }

  const trimmed = input.trim();
  const match = trimmed.match(/warcraftlogs\.com\/reports\/([A-Za-z0-9]+)/i);
  if (match) {
    return match[1];
  }

  if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
    throw new Error(`Cannot extract a report code from: ${input}`);
  }

  return trimmed;
}

function formatTimestamp(milliseconds) {
  const safeValue = Math.max(0, Number(milliseconds) || 0);
  const totalSeconds = Math.floor(safeValue / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function loadBossMapping() {
  if (!cachedBossMapping) {
    cachedBossMapping = readJson(BOSS_MAPPING_PATH);
  }
  return cachedBossMapping;
}

function loadTimelineFilters() {
  if (!cachedTimelineFilters) {
    cachedTimelineFilters = readJson(TIMELINE_FILTERS_PATH);
  }
  return cachedTimelineFilters;
}

function loadFetchPolicy() {
  if (!cachedFetchPolicy) {
    cachedFetchPolicy = readJson(FETCH_POLICY_PATH);
  }
  return cachedFetchPolicy;
}

function loadTimelinePresets() {
  if (!cachedTimelinePresets) {
    cachedTimelinePresets = readJson(TIMELINE_PRESETS_PATH);
  }
  return cachedTimelinePresets;
}

function mergeTimelinePreset(basePreset = {}, overridePreset = {}) {
  return {
    presetId: overridePreset.presetId || basePreset.presetId || "default",
    presetName: overridePreset.presetName || basePreset.presetName || "默认预设",
    bossAbilities: overridePreset.bossAbilities || basePreset.bossAbilities || [],
    heroTalent: {
      overridesByPlayer: {
        ...(basePreset.heroTalent?.overridesByPlayer || {}),
        ...(overridePreset.heroTalent?.overridesByPlayer || {})
      },
      overridesByClassSpec: {
        ...(basePreset.heroTalent?.overridesByClassSpec || {}),
        ...(overridePreset.heroTalent?.overridesByClassSpec || {})
      },
      detectByClassSpec: {
        ...(basePreset.heroTalent?.detectByClassSpec || {}),
        ...(overridePreset.heroTalent?.detectByClassSpec || {})
      }
    },
    classes: {
      ...(basePreset.classes || {}),
      ...(overridePreset.classes || {})
    }
  };
}

function getTimelinePreset(selector) {
  const presets = loadTimelinePresets();
  const key = normalizeText(selector);
  const overrides = presets.bosses || {};
  const overrideEntry =
    Object.entries(overrides).find(([name]) => normalizeText(name) === key)?.[1] ||
    Object.values(overrides).find((item) => normalizeText(item?.matchName) === key) ||
    {};

  return mergeTimelinePreset(presets.default || {}, overrideEntry);
}

function getBossMappingEntry(selector) {
  const mapping = loadBossMapping();
  const normalizedSelector = normalizeText(selector);
  const entry = Object.entries(mapping.bosses || {}).find(([name, item]) => {
    if (normalizeText(name) === normalizedSelector) {
      return true;
    }

    if (normalizeText(item.slug) === normalizedSelector) {
      return true;
    }

    return (item.aliases || []).some((alias) => normalizeText(alias) === normalizedSelector);
  });

  if (!entry) {
    return mapping.default || { slug: null, aliases: [], encounterId: null, zoneId: null, preferredDifficulty: 4 };
  }

  return {
    canonicalName: entry[0],
    slug: entry[1].slug || null,
    aliases: entry[1].aliases || [],
    encounterId: entry[1].encounterId || null,
    zoneId: entry[1].zoneId || null,
    preferredDifficulty: entry[1].preferredDifficulty || mapping.default?.preferredDifficulty || 4
  };
}

function getTimelineFilterSet(bossName) {
  const filters = loadTimelineFilters();
  const bossEntry = filters.bosses?.[bossName] || {};
  const defaults = filters.default || {};

  return {
    graphQlDataTypes: bossEntry.graphQlDataTypes || defaults.graphQlDataTypes || [],
    allowedEventTypes: bossEntry.allowedEventTypes || defaults.allowedEventTypes || [],
    includeBeginCast: bossEntry.includeBeginCast ?? defaults.includeBeginCast ?? false,
    blacklistAbilityNames: [...(defaults.blacklistAbilityNames || []), ...(bossEntry.blacklistAbilityNames || [])],
    blacklistAbilityGameIds: [...(defaults.blacklistAbilityGameIds || []), ...(bossEntry.blacklistAbilityGameIds || [])],
    whitelistAbilityNames: [...(defaults.whitelistAbilityNames || []), ...(bossEntry.whitelistAbilityNames || [])],
    whitelistAbilityGameIds: [...(defaults.whitelistAbilityGameIds || []), ...(bossEntry.whitelistAbilityGameIds || [])]
  };
}

function toNumberSet(items) {
  return new Set((items || []).map((item) => Number(item.id ?? item)).filter((value) => Number.isFinite(value)));
}

function parseInteger(value, fallback = null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

module.exports = {
  ensureDir,
  extractReportCode,
  formatTimestamp,
  getBossMappingEntry,
  getTimelineFilterSet,
  loadBossMapping,
  loadEnvFile,
  loadFetchPolicy,
  loadTimelinePresets,
  getTimelinePreset,
  loadTimelineFilters,
  normalizeText,
  parseInteger,
  readJson,
  requireV2Credentials,
  toNumberSet,
  writeJson
};
