const path = require("path");
const { DEFAULT_RANKINGS_DIFFICULTY, DEFAULT_RANKINGS_PAGE_SIZE, WCL_RANKINGS_ROOT } = require("./config");
const { graphqlRequest } = require("./graphql");
const { CHARACTER_RANKINGS_QUERY, ENCOUNTER_BY_ID_QUERY, FIGHT_RANKINGS_QUERY, SEARCH_ZONES_QUERY } = require("./queries");
const { getBossMappingEntry, loadFetchPolicy, normalizeText, parseInteger, writeJson } = require("./utils");

function normalizeFightRankingEntry(entry, index) {
  return {
    rank: index + 1,
    duration: entry.duration ?? null,
    startTime: entry.startTime ?? null,
    reportCode: entry.report?.code || null,
    fightId: entry.report?.fightID || null,
    reportStartTime: entry.report?.startTime || null,
    bracketData: entry.bracketData ?? null,
    size: entry.size ?? null,
    deaths: entry.deaths ?? null,
    tanks: entry.tanks ?? null,
    healers: entry.healers ?? null,
    melee: entry.melee ?? null,
    ranged: entry.ranged ?? null,
    server: entry.server || null,
    guild: entry.guild || null,
    damageTaken: entry.damageTaken ?? null
  };
}

function normalizeCharacterRankingEntry(entry, index) {
  return {
    rank: index + 1,
    playerName: entry.name || null,
    className: entry.class || null,
    specName: entry.spec || null,
    metricValue: entry.amount ?? null,
    duration: entry.duration ?? null,
    startTime: entry.startTime ?? null,
    reportCode: entry.report?.code || null,
    fightId: entry.report?.fightID || null,
    reportStartTime: entry.report?.startTime || null,
    hardModeLevel: entry.hardModeLevel ?? null,
    bracketData: entry.bracketData ?? null,
    size: entry.size ?? null,
    faction: entry.faction ?? null,
    server: entry.server || null,
    guild: entry.guild || null
  };
}

async function resolveEncounter(selector) {
  const numericSelector = parseInteger(selector);
  if (numericSelector !== null) {
    const data = await graphqlRequest(ENCOUNTER_BY_ID_QUERY, { encounterId: numericSelector });
    const encounter = data.worldData?.encounter;
    if (!encounter) {
      throw new Error(`Encounter ${numericSelector} was not found.`);
    }

    const mapping = getBossMappingEntry(encounter.name);
    return {
      encounterId: encounter.id,
      bossName: encounter.name,
      zoneId: encounter.zone?.id || null,
      zoneName: encounter.zone?.name || null,
      slug: mapping.slug || null,
      preferredDifficulty: mapping.preferredDifficulty || DEFAULT_RANKINGS_DIFFICULTY
    };
  }

  const mapped = getBossMappingEntry(selector);
  if (mapped.encounterId) {
    return {
      encounterId: mapped.encounterId,
      bossName: mapped.canonicalName || selector,
      zoneId: mapped.zoneId || null,
      zoneName: null,
      slug: mapped.slug || null,
      preferredDifficulty: mapped.preferredDifficulty || DEFAULT_RANKINGS_DIFFICULTY
    };
  }

  const data = await graphqlRequest(SEARCH_ZONES_QUERY);
  const normalizedSelector = normalizeText(selector);
  for (const zone of data.worldData?.zones || []) {
    for (const encounter of zone.encounters || []) {
      if (normalizeText(encounter.name) === normalizedSelector) {
        const mapping = getBossMappingEntry(encounter.name);
        return {
          encounterId: encounter.id,
          bossName: encounter.name,
          zoneId: zone.id,
          zoneName: zone.name,
          slug: mapping.slug || null,
          preferredDifficulty: mapping.preferredDifficulty || DEFAULT_RANKINGS_DIFFICULTY
        };
      }
    }
  }

  throw new Error(`Cannot resolve encounter from selector: ${selector}`);
}

function sanitizeFilePart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getRankingsOutputStem(selector, options = {}) {
  const base = String(selector);
  if (options.mode !== "character") {
    return `${base}-d${options.difficulty}`;
  }

  const classPart = sanitizeFilePart(options.className || "all-classes") || "all-classes";
  const specPart = sanitizeFilePart(options.specName || "all-specs") || "all-specs";
  const metricPart = sanitizeFilePart(options.metric || "dps") || "dps";
  return `${base}-d${options.difficulty}-${classPart}-${specPart}-${metricPart}`;
}

function getRankingsOutputPath(selector, options = {}) {
  return path.join(WCL_RANKINGS_ROOT, `${getRankingsOutputStem(selector, options)}.json`);
}

function parseRankingsOptions(rawOptions = {}) {
  const policy = loadFetchPolicy();
  const rankingPolicy = policy.rankings || {};
  const characterPolicy = rankingPolicy.character || {};
  const mode = normalizeText(rawOptions.mode || rankingPolicy.defaultMode || "fight") === "character" ? "character" : "fight";

  return {
    mode,
    difficulty: parseInteger(rawOptions.difficulty, rankingPolicy.defaultDifficulty || DEFAULT_RANKINGS_DIFFICULTY),
    page: parseInteger(rawOptions.page, 1),
    size: parseInteger(rawOptions.size, rankingPolicy.defaultTopN || DEFAULT_RANKINGS_PAGE_SIZE),
    serverRegion: rawOptions.serverRegion ?? rankingPolicy.preferredRegion ?? null,
    className: rawOptions.className ?? characterPolicy.className ?? null,
    specName: rawOptions.specName ?? characterPolicy.specName ?? null,
    metric: rawOptions.metric ?? characterPolicy.metric ?? "dps",
    write: rawOptions.write
  };
}

async function requestRankings(encounterId, options, fallbackToGlobal) {
  const variables = {
    encounterId,
    difficulty: options.difficulty,
    page: options.page,
    serverRegion: options.serverRegion
  };

  let query = FIGHT_RANKINGS_QUERY;
  let payloadKey = "fightRankings";

  if (options.mode === "character") {
    query = CHARACTER_RANKINGS_QUERY;
    payloadKey = "characterRankings";
    variables.className = options.className;
    variables.specName = options.specName;
    variables.metric = options.metric;
  }

  let data = await graphqlRequest(query, variables);
  let payload = data.worldData?.encounter?.[payloadKey];

  if (fallbackToGlobal && options.serverRegion && (!payload || payload.error || !(payload.rankings || []).length)) {
    data = await graphqlRequest(query, { ...variables, serverRegion: null });
    payload = data.worldData?.encounter?.[payloadKey];
  }

  if (!payload || payload.error) {
    throw new Error(payload?.error || "Rankings were not returned.");
  }

  return { data, payload };
}

async function fetchRankings(selector, rawOptions = {}) {
  const policy = loadFetchPolicy();
  const encounter = await resolveEncounter(selector);
  const options = parseRankingsOptions({
    ...rawOptions,
    difficulty: rawOptions.difficulty ?? encounter.preferredDifficulty
  });

  if (options.mode === "character" && !options.className) {
    throw new Error("Character rankings mode requires --class <ClassName> or rankings.character.className in fetch-policy.json.");
  }

  const { data, payload } = await requestRankings(encounter.encounterId, options, policy.rankings?.fallbackToGlobal);
  const encounterData = data.worldData?.encounter;
  const normalizeEntry = options.mode === "character" ? normalizeCharacterRankingEntry : normalizeFightRankingEntry;
  const rankings = (payload.rankings || []).map((entry, index) => normalizeEntry(entry, index)).slice(0, options.size);

  const result = {
    mode: options.mode,
    encounterId: encounter.encounterId,
    bossName: encounterData?.name || encounter.bossName,
    bossSlug: encounter.slug || null,
    zoneId: encounterData?.zone?.id || encounter.zoneId || null,
    zoneName: encounterData?.zone?.name || encounter.zoneName || null,
    difficulty: options.difficulty,
    page: options.page,
    pageSize: options.size,
    region: options.serverRegion || "GLOBAL",
    hasMorePages: Boolean(payload.hasMorePages),
    total: payload.count ?? rankings.length,
    rankings
  };

  if (options.mode === "character") {
    result.className = options.className;
    result.specName = options.specName || null;
    result.metric = options.metric;
  }

  if (options.write !== false) {
    writeJson(
      getRankingsOutputPath(result.bossSlug || result.encounterId, {
        mode: result.mode,
        difficulty: result.difficulty,
        className: result.className,
        specName: result.specName,
        metric: result.metric
      }),
      result
    );
  }

  return result;
}

function parseCliArgs(argv) {
  const positional = [];
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }

    const key = token.slice(2);
    const nextValue = argv[index + 1];
    if (!nextValue || nextValue.startsWith("--")) {
      options[key] = true;
      continue;
    }

    options[key] = nextValue;
    index += 1;
  }

  return { positional, options };
}

async function main() {
  try {
    const { positional, options } = parseCliArgs(process.argv.slice(2));
    const [selector, sizeArg, difficultyArg] = positional;
    if (selector === "--help" || selector === "-h" || options.help) {
      console.log("Usage: node scripts/wcl/fetch-rankings.js <bossName|encounterId> [topN] [difficulty] [--mode fight|character] [--class Mage] [--spec Fire] [--metric dps] [--region CN]");
      return;
    }
    if (!selector) {
      throw new Error("Usage: node scripts/wcl/fetch-rankings.js <bossName|encounterId> [topN] [difficulty] [--mode fight|character] [--class Mage] [--spec Fire] [--metric dps] [--region CN]");
    }

    const result = await fetchRankings(selector, {
      size: sizeArg,
      difficulty: difficultyArg,
      mode: options.mode,
      className: options.class,
      specName: options.spec,
      metric: options.metric,
      serverRegion: options.region
    });

    console.log(JSON.stringify(result, null, 2));
    console.log("");
    console.log(`Summary: ${result.rankings.length} ranking entries for ${result.bossName} (${result.mode} mode, difficulty ${result.difficulty}).`);
    console.log(
      `Output: ${getRankingsOutputPath(result.bossSlug || result.encounterId, {
        mode: result.mode,
        difficulty: result.difficulty,
        className: result.className,
        specName: result.specName,
        metric: result.metric
      })}`
    );
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  fetchRankings,
  getRankingsOutputPath,
  getRankingsOutputStem,
  normalizeCharacterRankingEntry,
  normalizeFightRankingEntry,
  parseCliArgs,
  parseRankingsOptions,
  resolveEncounter,
  sanitizeFilePart
};
