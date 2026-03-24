const { graphqlRequest } = require("./graphql");
const { REPORT_FIGHTS_QUERY, REPORT_PLAYER_DETAILS_QUERY } = require("./queries");
const { extractReportCode, getBossMappingEntry, loadFetchPolicy, normalizeText, parseInteger } = require("./utils");

function normalizeFight(reportCode, fight) {
  const mapping = getBossMappingEntry(fight.name);
  return {
    reportCode,
    id: fight.id,
    encounterId: fight.encounterID || 0,
    bossName: fight.name,
    slug: mapping.slug || null,
    aliases: mapping.aliases || [],
    isBoss: Boolean(fight.encounterID),
    difficulty: fight.difficulty ?? null,
    kill: Boolean(fight.kill),
    startTime: fight.startTime,
    endTime: fight.endTime,
    enemyNPCs: fight.enemyNPCs || [],
    friendlyPlayers: fight.friendlyPlayers || [],
    friendlyPets: fight.friendlyPets || []
  };
}

function filterFights(fights, includeAll = false) {
  return includeAll ? fights : fights.filter((fight) => fight.isBoss);
}

function findFight(fights, selector) {
  if (selector === undefined || selector === null || selector === "") {
    return null;
  }

  const numericSelector = parseInteger(selector);
  if (numericSelector !== null) {
    return fights.find((fight) => fight.id === numericSelector) || null;
  }

  const normalizedSelector = normalizeText(selector);
  return (
    fights.find((fight) => normalizeText(fight.bossName) === normalizedSelector) ||
    fights.find((fight) => normalizeText(fight.slug) === normalizedSelector) ||
    fights.find((fight) => (fight.aliases || []).some((alias) => normalizeText(alias) === normalizedSelector)) ||
    null
  );
}

function buildAbilityMap(masterData) {
  return new Map((masterData?.abilities || []).map((ability) => [Number(ability.gameID), ability.name || `Ability ${ability.gameID}`]));
}

function buildActorMap(masterData) {
  return new Map((masterData?.actors || []).map((actor) => [Number(actor.id), actor]));
}

async function fetchReportFights(input, options = {}) {
  const policy = loadFetchPolicy();
  const reportCode = extractReportCode(input);
  const fightIds = options.fightId ? [Number(options.fightId)] : null;
  const data = await graphqlRequest(REPORT_FIGHTS_QUERY, {
    code: reportCode,
    fightIds,
    translate: options.translate ?? policy.report?.translate ?? true
  });
  const report = data.reportData?.report;
  if (!report) {
    throw new Error(`Report ${reportCode} was not found or is private.`);
  }

  const normalizedFights = (report.fights || []).map((fight) => normalizeFight(reportCode, fight));
  return {
    reportCode,
    title: report.title || null,
    start: report.startTime || 0,
    end: report.endTime || 0,
    fights: filterFights(normalizedFights, options.includeAll),
    raw: report,
    abilityMap: buildAbilityMap(report.masterData),
    actorMap: buildActorMap(report.masterData)
  };
}

function flattenPlayerDetails(payload) {
  const groups = payload?.data?.playerDetails || payload?.playerDetails || {};
  return ["tanks", "healers", "dps"].flatMap((role) =>
    (groups[role] || []).map((player) => ({
      ...player,
      role
    }))
  );
}

function buildPlayerDetailsMap(payload) {
  return new Map(
    flattenPlayerDetails(payload).map((player) => [
      Number(player.id),
      {
        id: Number(player.id),
        name: player.name || null,
        role: player.role || null,
        className: player.type || null,
        specName: player.specs?.[0]?.spec || null,
        icon: player.icon || null,
        combatantInfo: player.combatantInfo || null
      }
    ])
  );
}

async function fetchReportPlayerDetails(input, options = {}) {
  const policy = loadFetchPolicy();
  const reportCode = extractReportCode(input);
  const fightIds = options.fightId ? [Number(options.fightId)] : null;
  const data = await graphqlRequest(REPORT_PLAYER_DETAILS_QUERY, {
    code: reportCode,
    fightIds,
    translate: options.translate ?? policy.report?.translate ?? false,
    includeCombatantInfo: options.includeCombatantInfo ?? true
  });
  const payload = data.reportData?.report?.playerDetails;
  if (!payload) {
    throw new Error(`Player details for report ${reportCode} were not returned.`);
  }

  return {
    reportCode,
    raw: payload,
    players: flattenPlayerDetails(payload),
    playerMap: buildPlayerDetailsMap(payload)
  };
}

async function main() {
  try {
    const [input, ...restArgs] = process.argv.slice(2);
    if (input === "--help" || input === "-h") {
      console.log("Usage: node scripts/wcl/fetch-report.js <reportCode|URL> [--all]");
      return;
    }

    if (!input) {
      throw new Error("Usage: node scripts/wcl/fetch-report.js <reportCode|URL> [--all]");
    }

    const report = await fetchReportFights(input, { includeAll: restArgs.includes("--all") });
    console.log(JSON.stringify({ reportCode: report.reportCode, title: report.title, fights: report.fights }, null, 2));
    console.log(`\nSummary: ${report.fights.length} fights listed for report ${report.reportCode}.`);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildAbilityMap,
  buildActorMap,
  buildPlayerDetailsMap,
  fetchReportFights,
  fetchReportPlayerDetails,
  filterFights,
  findFight,
  flattenPlayerDetails,
  normalizeFight
};
