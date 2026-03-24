const path = require("path");
const { WCL_STUDIES_ROOT } = require("./config");
const { formatTimestamp, loadFetchPolicy, parseInteger, writeJson } = require("./utils");

function sanitizeFilePart(value, fallback = "all") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function getStudyOutputStem(selector, options = {}) {
  const difficulty = parseInteger(options.difficulty, 4);
  const classPart = sanitizeFilePart(options.className, "all-classes");
  const specPart = sanitizeFilePart(options.specName, "all-specs");
  const metricPart = sanitizeFilePart(options.metric, "dps");
  return `${selector}-d${difficulty}-${classPart}-${specPart}-${metricPart}`;
}

function getStudyOutputPath(selector, options = {}) {
  return path.join(WCL_STUDIES_ROOT, `${getStudyOutputStem(selector, options)}.json`);
}

function formatOffsetLabel(offsetMs) {
  const seconds = Math.abs(offsetMs) / 1000;
  const signed = `${offsetMs >= 0 ? "+" : "-"}${seconds.toFixed(1)}s`;
  return signed;
}

function buildResponsesForOccurrence(classTimeline, bossEntry, windowBeforeMs, windowAfterMs) {
  return classTimeline
    .filter((entry) => {
      const offset = entry.timestamp - bossEntry.timestamp;
      return offset >= -windowBeforeMs && offset <= windowAfterMs;
    })
    .map((entry) => ({
      timestamp: entry.timestamp,
      t: entry.t,
      offsetMs: entry.timestamp - bossEntry.timestamp,
      offsetLabel: formatOffsetLabel(entry.timestamp - bossEntry.timestamp),
      abilityGameId: entry.abilityGameId,
      abilityName: entry.abilityName,
      abilityLabel: entry.abilityLabel,
      sourceName: entry.sourceName,
      className: entry.className,
      classLabel: entry.classLabel,
      specName: entry.specName,
      heroTalent: entry.heroTalent || null
    }))
    .sort((left, right) => left.timestamp - right.timestamp);
}

function summarizeResponses(occurrences) {
  const map = new Map();

  for (const occurrence of occurrences) {
    for (const response of occurrence.responses || []) {
      const key = String(response.abilityGameId);
      const current = map.get(key) || {
        key,
        abilityGameId: response.abilityGameId,
        label: response.abilityLabel || response.abilityName,
        count: 0,
        players: new Set()
      };

      current.count += 1;
      if (occurrence.playerName) {
        current.players.add(occurrence.playerName);
      }
      map.set(key, current);
    }
  }

  return [...map.values()]
    .map((entry) => ({
      key: entry.key,
      abilityGameId: entry.abilityGameId,
      label: entry.label,
      count: entry.count,
      players: [...entry.players].sort()
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function buildFilterOptions(groupedAbilities, samples) {
  const bossAbilities = groupedAbilities.map((group) => ({
    key: String(group.abilityGameId),
    label: group.label
  }));

  const players = samples.map((sample) => ({
    key: sample.sampleId,
    label: sample.playerName || sample.sampleId
  }));

  const classes = [...new Map(
    samples
      .filter((sample) => sample.className)
      .map((sample) => [sample.className, { key: sample.className, label: sample.className }])
  ).values()];

  const specs = [...new Map(
    samples
      .filter((sample) => sample.specName)
      .map((sample) => [sample.specName, { key: sample.specName, label: sample.specName }])
  ).values()];

  const classAbilities = [...new Map(
    groupedAbilities
      .flatMap((group) => group.responseSummary)
      .map((entry) => [entry.key, { key: entry.key, label: entry.label }])
  ).values()];

  return { bossAbilities, players, classes, specs, classAbilities };
}

function buildStudyPayload(rankings, timelinePayloads, options = {}) {
  const studyPolicy = loadFetchPolicy().study || {};
  const windowBeforeMs = parseInteger(options.windowBeforeMs, parseInteger(studyPolicy.windowBeforeMs, 12000));
  const windowAfterMs = parseInteger(options.windowAfterMs, parseInteger(studyPolicy.windowAfterMs, 15000));
  const samples = timelinePayloads.map((timeline, index) => {
    const ranking = rankings.rankings[index] || {};
    return {
      sampleId: `${timeline.reportCode}-${timeline.fightId}`,
      rank: ranking.rank ?? index + 1,
      playerName: ranking.playerName || null,
      className: ranking.className || null,
      specName: ranking.specName || null,
      heroTalent: ranking.heroTalent || null,
      reportCode: timeline.reportCode,
      fightId: timeline.fightId,
      server: ranking.server || null,
      guild: ranking.guild || null,
      metricValue: ranking.metricValue ?? null,
      duration: ranking.duration ?? timeline.endTime ?? null,
      timelineCount: timeline.timeline?.length || 0
    };
  });

  const groupedAbilityMap = new Map();

  for (const timeline of timelinePayloads) {
    const sample = samples.find((item) => item.reportCode === timeline.reportCode && item.fightId === timeline.fightId);
    for (const bossEntry of timeline.bossTimeline || []) {
      const key = String(bossEntry.abilityGameId);
      const current = groupedAbilityMap.get(key) || {
        key,
        abilityGameId: bossEntry.abilityGameId,
        label: bossEntry.abilityLabel || bossEntry.abilityName,
        abilityName: bossEntry.abilityName,
        occurrences: []
      };

      current.occurrences.push({
        sampleId: sample?.sampleId || `${timeline.reportCode}-${timeline.fightId}`,
        playerName: sample?.playerName || null,
        rank: sample?.rank ?? null,
        reportCode: timeline.reportCode,
        fightId: timeline.fightId,
        timestamp: bossEntry.timestamp,
        t: bossEntry.t,
        sourceName: bossEntry.sourceName,
        responses: buildResponsesForOccurrence(timeline.classTimeline || [], bossEntry, windowBeforeMs, windowAfterMs)
      });

      groupedAbilityMap.set(key, current);
    }
  }

  const groupedAbilities = [...groupedAbilityMap.values()]
    .map((group) => ({
      ...group,
      sampleCount: new Set(group.occurrences.map((item) => item.sampleId)).size,
      responseSummary: summarizeResponses(group.occurrences),
      occurrences: group.occurrences.sort((left, right) => {
        if ((left.rank ?? Number.MAX_SAFE_INTEGER) !== (right.rank ?? Number.MAX_SAFE_INTEGER)) {
          return (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER);
        }
        return left.timestamp - right.timestamp;
      })
    }))
    .sort((left, right) => left.occurrences[0]?.timestamp - right.occurrences[0]?.timestamp);

  return {
    bossSlug: rankings.bossSlug,
    bossName: rankings.bossName,
    encounterId: rankings.encounterId,
    difficulty: rankings.difficulty,
    className: rankings.className,
    specName: rankings.specName || null,
    metric: rankings.metric,
    sampleCount: samples.length,
    generatedAt: new Date().toISOString(),
    responseWindow: {
      beforeMs: windowBeforeMs,
      afterMs: windowAfterMs,
      beforeLabel: formatTimestamp(windowBeforeMs),
      afterLabel: formatTimestamp(windowAfterMs)
    },
    samples,
    filters: buildFilterOptions(groupedAbilities, samples),
    groupedAbilities
  };
}

function writeStudyPayload(payload) {
  writeJson(
    getStudyOutputPath(payload.bossSlug || payload.encounterId, {
      difficulty: payload.difficulty,
      className: payload.className,
      specName: payload.specName,
      metric: payload.metric
    }),
    payload
  );
}

module.exports = {
  buildStudyPayload,
  formatOffsetLabel,
  getStudyOutputPath,
  getStudyOutputStem,
  summarizeResponses,
  writeStudyPayload
};
