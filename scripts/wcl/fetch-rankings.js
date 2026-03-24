const path = require("path");
const { DEFAULT_RANKINGS_DIFFICULTY, DEFAULT_RANKINGS_PAGE_SIZE, WCL_RANKINGS_ROOT } = require("./config");
const { graphqlRequest } = require("./graphql");
const { ENCOUNTER_BY_ID_QUERY, FIGHT_RANKINGS_QUERY, SEARCH_ZONES_QUERY } = require("./queries");
const { getBossMappingEntry, normalizeText, parseInteger, writeJson } = require("./utils");

function normalizeRankingEntry(entry, index) {
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

function getRankingsOutputPath(slugOrEncounterId, difficulty) {
  return path.join(WCL_RANKINGS_ROOT, `${slugOrEncounterId}-d${difficulty}.json`);
}

async function fetchRankings(selector, options = {}) {
  const encounter = await resolveEncounter(selector);
  const difficulty = parseInteger(options.difficulty, encounter.preferredDifficulty || DEFAULT_RANKINGS_DIFFICULTY);
  const page = parseInteger(options.page, 1);
  const size = parseInteger(options.size, DEFAULT_RANKINGS_PAGE_SIZE);
  const data = await graphqlRequest(FIGHT_RANKINGS_QUERY, {
    encounterId: encounter.encounterId,
    difficulty,
    page
  });

  const payload = data.worldData?.encounter?.fightRankings;
  if (!payload || payload.error) {
    throw new Error(payload?.error || "Fight rankings were not returned.");
  }

  const rankings = (payload.rankings || []).map((entry, index) => normalizeRankingEntry(entry, index)).slice(0, size);
  const result = {
    encounterId: encounter.encounterId,
    bossName: data.worldData.encounter.name,
    bossSlug: encounter.slug || null,
    zoneId: data.worldData.encounter.zone?.id || encounter.zoneId || null,
    zoneName: data.worldData.encounter.zone?.name || encounter.zoneName || null,
    difficulty,
    page,
    pageSize: size,
    hasMorePages: Boolean(payload.hasMorePages),
    total: payload.count ?? rankings.length,
    rankings
  };

  if (options.write !== false) {
    writeJson(getRankingsOutputPath(result.bossSlug || result.encounterId, result.difficulty), result);
  }

  return result;
}

async function main() {
  try {
    const [selector, sizeArg, difficultyArg] = process.argv.slice(2);
    if (selector === "--help" || selector === "-h") {
      console.log("Usage: node scripts/wcl/fetch-rankings.js <bossName|encounterId> [topN] [difficulty]");
      return;
    }
    if (!selector) {
      throw new Error("Usage: node scripts/wcl/fetch-rankings.js <bossName|encounterId> [topN] [difficulty]");
    }

    const result = await fetchRankings(selector, { size: sizeArg, difficulty: difficultyArg });
    console.log(JSON.stringify(result, null, 2));
    console.log(`\nSummary: ${result.rankings.length} ranking entries for ${result.bossName} (difficulty ${result.difficulty}).`);
    console.log(`Output: ${getRankingsOutputPath(result.bossSlug || result.encounterId, result.difficulty)}`);
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
  normalizeRankingEntry,
  resolveEncounter
};
