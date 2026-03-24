const path = require("path");
const { WCL_TIMELINES_ROOT } = require("./config");
const { fetchFightEvents } = require("./fetch-events");
const { fetchReportFights, findFight } = require("./fetch-report");
const { formatTimestamp, getBossMappingEntry, getTimelineFilterSet, toNumberSet, writeJson } = require("./utils");

function buildActorSets(fight) {
  return {
    friendlyIds: toNumberSet(fight.friendlyPlayers),
    friendlyPetIds: toNumberSet(fight.friendlyPets),
    enemyIds: toNumberSet(fight.enemyNPCs)
  };
}

function getAbilityName(event, abilityMap) {
  return abilityMap.get(Number(event.abilityGameID)) || `Ability ${event.abilityGameID || "Unknown"}`;
}

function getSourceName(event, actorMap) {
  return actorMap.get(Number(event.sourceID))?.name || null;
}

function eventMatchesFilters(event, actorSets, filterSet, abilityMap) {
  const eventType = String(event.type || "").toLowerCase();
  const abilityGameId = Number(event.abilityGameID);
  const abilityName = getAbilityName(event, abilityMap);
  const sourceId = Number(event.sourceID);
  const targetId = Number(event.targetID);
  const sourceIsFriendly = actorSets.friendlyIds.has(sourceId) || actorSets.friendlyPetIds.has(sourceId);
  const targetIsFriendly = actorSets.friendlyIds.has(targetId) || actorSets.friendlyPetIds.has(targetId);
  const whitelistNames = new Set((filterSet.whitelistAbilityNames || []).map((item) => String(item).toLowerCase()));
  const whitelistIds = new Set((filterSet.whitelistAbilityGameIds || []).map(Number));
  const blacklistNames = new Set((filterSet.blacklistAbilityNames || []).map((item) => String(item).toLowerCase()));
  const blacklistIds = new Set((filterSet.blacklistAbilityGameIds || []).map(Number));
  const allowedEventTypes = new Set((filterSet.allowedEventTypes || []).map((item) => String(item).toLowerCase()));

  if (!filterSet.includeBeginCast && eventType === "begincast") {
    return false;
  }

  if (!allowedEventTypes.has(eventType)) {
    return false;
  }

  if (sourceIsFriendly) {
    return false;
  }

  if (!targetIsFriendly && eventType !== "cast") {
    return false;
  }

  if (blacklistNames.has(abilityName.toLowerCase()) || blacklistIds.has(abilityGameId)) {
    return false;
  }

  if (whitelistNames.size > 0 || whitelistIds.size > 0) {
    return whitelistNames.has(abilityName.toLowerCase()) || whitelistIds.has(abilityGameId);
  }

  return actorSets.enemyIds.size === 0 || actorSets.enemyIds.has(sourceId);
}

function normalizeTimelineEvent(event, fight, abilityMap, actorMap) {
  const timestamp = Math.max(0, Number(event.timestamp) - Number(fight.startTime));
  return {
    t: formatTimestamp(timestamp),
    timestamp,
    abilityGameId: Number(event.abilityGameID) || null,
    abilityName: getAbilityName(event, abilityMap),
    type: event.type,
    sourceId: event.sourceID ?? null,
    sourceName: getSourceName(event, actorMap)
  };
}

function buildTimelinePayload(report, fight, events) {
  const actorSets = buildActorSets(fight);
  const filterSet = getTimelineFilterSet(fight.bossName);
  const timeline = events
    .filter((event) => eventMatchesFilters(event, actorSets, filterSet, report.abilityMap))
    .map((event) => normalizeTimelineEvent(event, fight, report.abilityMap, report.actorMap))
    .sort((left, right) => left.timestamp - right.timestamp);

  const mapping = getBossMappingEntry(fight.bossName);

  return {
    reportCode: report.reportCode,
    fightId: fight.id,
    bossName: fight.bossName,
    bossSlug: mapping.slug || null,
    encounterId: fight.encounterId,
    difficulty: fight.difficulty,
    startTime: 0,
    endTime: fight.endTime - fight.startTime,
    timeline
  };
}

function getOutputPath(reportCode, fightId) {
  return path.join(WCL_TIMELINES_ROOT, `${reportCode}-${fightId}.json`);
}

async function buildTimeline(reportInput, selector, options = {}) {
  const report = typeof reportInput === "string" ? await fetchReportFights(reportInput, { includeAll: true }) : reportInput;
  const fight = findFight(report.fights, selector);
  if (!fight) {
    throw new Error(`Cannot find fight: ${selector}`);
  }

  const filterSet = getTimelineFilterSet(fight.bossName);
  const eventResult = await fetchFightEvents(report.reportCode, fight.id, {
    dataTypes: filterSet.graphQlDataTypes || ["Casts"]
  });
  const payload = buildTimelinePayload(report, fight, eventResult.events);

  if (options.write !== false) {
    writeJson(getOutputPath(report.reportCode, fight.id), payload);
  }

  return {
    ...payload,
    eventCount: eventResult.events.length,
    pageCount: eventResult.pageCount
  };
}

module.exports = {
  buildActorSets,
  buildTimeline,
  buildTimelinePayload,
  eventMatchesFilters,
  getOutputPath,
  normalizeTimelineEvent
};
