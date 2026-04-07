const path = require("path");
const { WCL_TIMELINES_ROOT } = require("./config");
const { fetchFightEvents } = require("./fetch-events");
const { fetchReportFights, fetchReportPlayerDetails, findFight } = require("./fetch-report");
const { detectHeroTalent } = require("./hero-talents");
const { formatTimestamp, getBossMappingEntry, getTimelineFilterSet, getTimelinePreset, loadFetchPolicy, toNumberSet, writeJson } = require("./utils");

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

function getSourceActor(event, actorMap) {
  return actorMap.get(Number(event.sourceID)) || null;
}

function getSourceName(event, actorMap) {
  return getSourceActor(event, actorMap)?.name || null;
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

function normalizeBossTimelineEvent(event, fight, abilityMap, actorMap, abilityLabel = null) {
  const timestamp = Math.max(0, Number(event.timestamp) - Number(fight.startTime));
  return {
    lane: "boss",
    t: formatTimestamp(timestamp),
    timestamp,
    abilityGameId: Number(event.abilityGameID) || null,
    abilityName: getAbilityName(event, abilityMap),
    abilityLabel: abilityLabel || getAbilityName(event, abilityMap),
    type: event.type,
    sourceId: event.sourceID ?? null,
    sourceName: getSourceName(event, actorMap)
  };
}

function eventMatchesClassPreset(playerDetails, abilityPreset, heroTalent) {
  if (!abilityPreset) {
    return false;
  }

  if (abilityPreset.specs?.length && !abilityPreset.specs.includes(playerDetails?.specName)) {
    return false;
  }

  if (abilityPreset.heroTalents?.length && !abilityPreset.heroTalents.includes(heroTalent)) {
    return false;
  }

  return true;
}

function normalizeClassTimelineEvent(event, fight, abilityMap, actorMap, playerDetails, abilityPreset, heroTalent, actorOverride = null) {
  const actor = actorOverride || getSourceActor(event, actorMap);
  const timestamp = Math.max(0, Number(event.timestamp) - Number(fight.startTime));
  return {
    lane: "class",
    t: formatTimestamp(timestamp),
    timestamp,
    abilityGameId: Number(event.abilityGameID) || null,
    abilityName: getAbilityName(event, abilityMap),
    abilityLabel: abilityPreset.label || getAbilityName(event, abilityMap),
    type: event.type,
    sourceId: event.sourceID ?? null,
    sourceName: actor?.name || null,
    className: actor?.subType || null,
    classLabel: abilityPreset.classLabel || actor?.subType || null,
    specName: playerDetails?.specName || null,
    heroTalent
  };
}

function buildBossTimeline(report, fight, events, preset) {
  const actorSets = buildActorSets(fight);
  const filterSet = getTimelineFilterSet(fight.bossName);
  const presetAbilities = new Map((preset.bossAbilities || []).map((item) => [Number(item.gameId), item]));

  const sourceEvents = events.filter((event) => eventMatchesFilters(event, actorSets, filterSet, report.abilityMap));
  const filteredEvents = presetAbilities.size
    ? sourceEvents.filter((event) => presetAbilities.has(Number(event.abilityGameID)))
    : sourceEvents;

  return filteredEvents
    .map((event) =>
      normalizeBossTimelineEvent(event, fight, report.abilityMap, report.actorMap, presetAbilities.get(Number(event.abilityGameID))?.label || null)
    )
    .sort((left, right) => left.timestamp - right.timestamp);
}

function buildClassPresetIndex(preset) {
  const classEntries = Object.entries(preset.classes || {});
  return {
    byClass: new Map(
      classEntries.map(([className, config]) => [
        className,
        {
          className,
          classLabel: config.label || className,
          abilities: new Map((config.abilities || []).map((item) => [Number(item.gameId), item]))
        }
      ])
    )
  };
}

function scopePresetToSelection(preset, options = {}) {
  const selectedClassName = options.className || null;
  const selectedSpecName = options.specName || null;

  if (!selectedClassName) {
    return preset;
  }

  const classConfig = preset.classes?.[selectedClassName];
  if (!classConfig) {
    return {
      ...preset,
      classes: {}
    };
  }

  const filteredAbilities = (classConfig.abilities || []).filter((ability) => {
    if (!selectedSpecName || !ability.specs?.length) {
      return true;
    }

    return ability.specs.includes(selectedSpecName);
  });

  return {
    ...preset,
    classes: {
      [selectedClassName]: {
        ...classConfig,
        abilities: filteredAbilities
      }
    }
  };
}

function getFriendlyEventTypesForPreset(preset) {
  const dataTypes = new Set(["Casts"]);

  for (const classConfig of Object.values(preset.classes || {})) {
    for (const ability of classConfig.abilities || []) {
      for (const dataType of ability.dataTypes || []) {
        dataTypes.add(dataType);
      }
    }
  }

  return [...dataTypes];
}

function getRelevantFriendlySourceIds(report, preset, playerDetailsMap) {
  const presetIndex = buildClassPresetIndex(preset);
  const ids = new Set();

  for (const actor of report.actorMap.values()) {
    if (actor?.type !== "Player") {
      continue;
    }

    const classConfig = presetIndex.byClass.get(actor.subType);
    if (!classConfig) {
      continue;
    }

    const playerDetails = playerDetailsMap.get(Number(actor.id));
    if (!playerDetails) {
      continue;
    }

    const hasMatchingAbility = [...classConfig.abilities.values()].some((abilityPreset) =>
      eventMatchesClassPreset(playerDetails, abilityPreset, detectHeroTalent(playerDetails, preset))
    );

    if (hasMatchingAbility) {
      ids.add(Number(actor.id));
    }
  }

  return ids;
}

async function fetchRelevantFriendlyCastEvents(reportCode, fight, relevantFriendlySourceIds, options = {}) {
  const policy = loadFetchPolicy();
  const windowMs = options.windowMs || policy.events?.friendlyWindowMs || 60000;
  const sliceLimit = options.sliceLimit || policy.events?.friendlySliceLimit || 5000;
  const dataTypes = options.dataTypes?.length ? options.dataTypes : ["Casts"];
  const eventMap = new Map();
  let pageCount = 0;

  for (let startTime = Number(fight.startTime); startTime <= Number(fight.endTime); startTime += windowMs) {
    const endTime = Math.min(Number(fight.endTime), startTime + windowMs - 1);
    const result = await fetchFightEvents(reportCode, fight.id, {
      dataTypes,
      hostilityType: "Friendlies",
      translate: false,
      startTime,
      endTime,
      limit: sliceLimit
    });

    pageCount += result.pageCount;

    for (const event of result.events) {
      const sourceId = Number(event.sourceID);
      const targetId = Number(event.targetID);
      if (!relevantFriendlySourceIds.has(sourceId) && !relevantFriendlySourceIds.has(targetId)) {
        continue;
      }

      const dedupeKey = [
        event.timestamp,
        event.sourceID,
        event.sourceInstance || "",
        event.targetID || "",
        event.abilityGameID,
        event.type,
        event.fake ? "1" : "0"
      ].join(":");

      eventMap.set(dedupeKey, event);
    }
  }

  return {
    reportCode,
    fightId: fight.id,
    pageCount,
    events: [...eventMap.values()].sort((left, right) => Number(left.timestamp) - Number(right.timestamp))
  };
}

function buildClassTimeline(report, fight, events, preset, playerDetailsMap) {
  const actorSets = buildActorSets(fight);
  const presetIndex = buildClassPresetIndex(preset);

  return events
    .filter((event) => {
      const eventType = String(event.type || "").toLowerCase();
      const sourceId = Number(event.sourceID);
      const targetId = Number(event.targetID);
      const candidateId = actorSets.friendlyIds.has(sourceId) ? sourceId : targetId;
      if (!candidateId || !actorSets.friendlyIds.has(candidateId)) {
        return false;
      }

      const actor = report.actorMap.get(candidateId);
      if (!actor || actor.type !== "Player") {
        return false;
      }

      const classConfig = presetIndex.byClass.get(actor.subType);
      if (!classConfig) {
        return false;
      }

      const abilityPreset = classConfig.abilities.get(Number(event.abilityGameID));
      if (!abilityPreset) {
        return false;
      }

      const allowedEventTypes = new Set((abilityPreset.eventTypes || ["cast"]).map((item) => String(item).toLowerCase()));
      if (!allowedEventTypes.has(eventType)) {
        return false;
      }

      const playerDetails = playerDetailsMap.get(candidateId);
      const heroTalent = detectHeroTalent(playerDetails, preset);
      return eventMatchesClassPreset(playerDetails, abilityPreset, heroTalent);
    })
    .map((event) => {
      const sourceId = Number(event.sourceID);
      const targetId = Number(event.targetID);
      const actorId = actorSets.friendlyIds.has(sourceId) ? sourceId : targetId;
      const actor = report.actorMap.get(actorId);
      const classConfig = presetIndex.byClass.get(actor.subType);
      const abilityPreset = classConfig.abilities.get(Number(event.abilityGameID));
      const playerDetails = playerDetailsMap.get(actorId);
      const heroTalent = detectHeroTalent(playerDetails, preset);
      return normalizeClassTimelineEvent(
        event,
        fight,
        report.abilityMap,
        report.actorMap,
        playerDetails,
        {
          ...abilityPreset,
          classLabel: classConfig.classLabel
        },
        heroTalent,
        actor
      );
    })
    .sort((left, right) => left.timestamp - right.timestamp);
}

function buildFilterOptions(bossTimeline, classTimeline) {
  const bossAbilities = [...new Map(bossTimeline.map((entry) => [String(entry.abilityGameId), { key: String(entry.abilityGameId), label: entry.abilityLabel }])).values()];
  const classes = [...new Map(classTimeline.map((entry) => [entry.className, { key: entry.className, label: entry.classLabel || entry.className }])).values()];
  const specs = Object.fromEntries(
    classes.map((classItem) => [
      classItem.key,
      [
        ...new Map(
          classTimeline
            .filter((entry) => entry.className === classItem.key && entry.specName)
            .map((entry) => [entry.specName, { key: entry.specName, label: entry.specName }])
        ).values()
      ]
    ])
  );
  const heroTalents = Object.fromEntries(
    classes.map((classItem) => [
      classItem.key,
      Object.fromEntries(
        (specs[classItem.key] || []).map((specItem) => [
          specItem.key,
          [
            ...new Map(
              classTimeline
                .filter((entry) => entry.className === classItem.key && entry.specName === specItem.key && entry.heroTalent)
                .map((entry) => [entry.heroTalent, { key: entry.heroTalent, label: entry.heroTalent }])
            ).values()
          ]
        ])
      )
    ])
  );
  const classAbilities = Object.fromEntries(
    classes.map((classItem) => [
      classItem.key,
      [
        ...new Map(
          classTimeline
            .filter((entry) => entry.className === classItem.key)
            .map((entry) => [String(entry.abilityGameId), { key: String(entry.abilityGameId), label: entry.abilityLabel }])
        ).values()
      ]
    ])
  );

  return { bossAbilities, classes, specs, heroTalents, classAbilities };
}

function buildTimelinePayload(report, fight, enemyEvents, friendlyEvents, playerDetailsMap = new Map()) {
  const mapping = getBossMappingEntry(fight.bossName);
  const preset = getTimelinePreset(mapping.slug || fight.bossName);
  const bossTimeline = buildBossTimeline(report, fight, enemyEvents, preset);
  const classTimeline = buildClassTimeline(report, fight, friendlyEvents, preset, playerDetailsMap);
  const filters = buildFilterOptions(bossTimeline, classTimeline);

  return {
    reportCode: report.reportCode,
    fightId: fight.id,
    bossName: fight.bossName,
    bossSlug: mapping.slug || null,
    encounterId: fight.encounterId,
    difficulty: fight.difficulty,
    startTime: 0,
    endTime: fight.endTime - fight.startTime,
    presetId: preset.presetId,
    presetName: preset.presetName,
    preset,
    filters,
    timeline: bossTimeline,
    bossTimeline,
    classTimeline
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
  const mapping = getBossMappingEntry(fight.bossName);
  const preset = scopePresetToSelection(getTimelinePreset(mapping.slug || fight.bossName), options);
  const playerDetails = await fetchReportPlayerDetails(report.reportCode, {
    fightId: fight.id,
    translate: false,
    includeCombatantInfo: true
  });
  const relevantFriendlySourceIds = getRelevantFriendlySourceIds(report, preset, playerDetails.playerMap);
  const [enemyEventResult, friendlyEventResult] = await Promise.all([
    fetchFightEvents(report.reportCode, fight.id, {
      dataTypes: filterSet.graphQlDataTypes || ["Casts"],
      hostilityType: "Enemies"
    }),
    fetchRelevantFriendlyCastEvents(report.reportCode, fight, relevantFriendlySourceIds, {
      ...options,
      dataTypes: getFriendlyEventTypesForPreset(preset)
    })
  ]);

  const payload = buildTimelinePayload(report, fight, enemyEventResult.events, friendlyEventResult.events, playerDetails.playerMap);

  if (options.write !== false) {
    writeJson(getOutputPath(report.reportCode, fight.id), payload);
  }

  return {
    ...payload,
    eventCount: enemyEventResult.events.length + friendlyEventResult.events.length,
    pageCount: enemyEventResult.pageCount + friendlyEventResult.pageCount
  };
}

module.exports = {
  buildActorSets,
  buildClassTimeline,
  buildTimeline,
  buildTimelinePayload,
  eventMatchesFilters,
  fetchRelevantFriendlyCastEvents,
  getRelevantFriendlySourceIds,
  getOutputPath,
  normalizeBossTimelineEvent,
  normalizeClassTimelineEvent
};
