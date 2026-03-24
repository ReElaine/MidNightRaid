const path = require("path");
const { WCL_STUDIES_ROOT } = require("./config");
const { parseInteger, writeJson } = require("./utils");

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

function buildSampleSummary(rankings, timelinePayloads) {
  return timelinePayloads.map((timeline, index) => {
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
}

function buildBossTrack(timelinePayloads, sampleMap) {
  const grouped = new Map();

  for (const timeline of timelinePayloads) {
    const sampleId = `${timeline.reportCode}-${timeline.fightId}`;
    const sample = sampleMap.get(sampleId);

    for (const entry of timeline.bossTimeline || []) {
      const key = `${entry.abilityGameId}:${entry.t}`;
      const current = grouped.get(key) || {
        key,
        abilityGameId: entry.abilityGameId,
        abilityName: entry.abilityName,
        abilityLabel: entry.abilityLabel || entry.abilityName,
        timestamp: entry.timestamp,
        t: entry.t,
        entries: []
      };

      current.entries.push({
        sampleId,
        playerName: sample?.playerName || null,
        rank: sample?.rank ?? null,
        reportCode: timeline.reportCode,
        fightId: timeline.fightId,
        timestamp: entry.timestamp,
        t: entry.t,
        sourceName: entry.sourceName || null
      });
      current.timestamp = Math.min(current.timestamp, entry.timestamp);
      grouped.set(key, current);
    }
  }

  return [...grouped.values()]
    .map((group) => ({
      ...group,
      sampleCount: new Set(group.entries.map((entry) => entry.sampleId)).size,
      entries: group.entries.sort((left, right) => {
        if ((left.rank ?? Number.MAX_SAFE_INTEGER) !== (right.rank ?? Number.MAX_SAFE_INTEGER)) {
          return (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER);
        }
        return left.timestamp - right.timestamp;
      })
    }))
    .sort((left, right) => left.timestamp - right.timestamp || left.abilityLabel.localeCompare(right.abilityLabel));
}

function buildClassTrack(timelinePayloads, sampleMap) {
  const entries = [];

  for (const timeline of timelinePayloads) {
    const sampleId = `${timeline.reportCode}-${timeline.fightId}`;
    const sample = sampleMap.get(sampleId);

    for (const entry of timeline.classTimeline || []) {
      entries.push({
        sampleId,
        playerName: sample?.playerName || null,
        rank: sample?.rank ?? null,
        className: entry.className || sample?.className || null,
        classLabel: entry.classLabel || entry.className || sample?.className || null,
        specName: entry.specName || sample?.specName || null,
        heroTalent: entry.heroTalent || sample?.heroTalent || null,
        reportCode: timeline.reportCode,
        fightId: timeline.fightId,
        timestamp: entry.timestamp,
        t: entry.t,
        abilityGameId: entry.abilityGameId,
        abilityName: entry.abilityName,
        abilityLabel: entry.abilityLabel || entry.abilityName,
        sourceName: entry.sourceName || sample?.playerName || null
      });
    }
  }

  return entries.sort((left, right) => {
    if (left.timestamp !== right.timestamp) {
      return left.timestamp - right.timestamp;
    }
    if ((left.rank ?? Number.MAX_SAFE_INTEGER) !== (right.rank ?? Number.MAX_SAFE_INTEGER)) {
      return (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER);
    }
    return (left.abilityLabel || "").localeCompare(right.abilityLabel || "");
  });
}

function buildTimelineRows(bossTrack, classTrack) {
  const rowMap = new Map();

  for (const entry of bossTrack) {
    const current = rowMap.get(entry.t) || {
      key: entry.t,
      t: entry.t,
      timestamp: entry.timestamp,
      bossEntries: [],
      classEntries: []
    };

    current.timestamp = Math.min(current.timestamp, entry.timestamp);
    current.bossEntries.push(entry);
    rowMap.set(entry.t, current);
  }

  for (const entry of classTrack) {
    const current = rowMap.get(entry.t) || {
      key: entry.t,
      t: entry.t,
      timestamp: entry.timestamp,
      bossEntries: [],
      classEntries: []
    };

    current.timestamp = Math.min(current.timestamp, entry.timestamp);
    current.classEntries.push(entry);
    rowMap.set(entry.t, current);
  }

  return [...rowMap.values()]
    .map((row) => ({
      ...row,
      bossEntries: row.bossEntries.sort((left, right) => left.timestamp - right.timestamp || left.abilityLabel.localeCompare(right.abilityLabel)),
      classEntries: row.classEntries.sort((left, right) => {
        if (left.timestamp !== right.timestamp) {
          return left.timestamp - right.timestamp;
        }
        if ((left.rank ?? Number.MAX_SAFE_INTEGER) !== (right.rank ?? Number.MAX_SAFE_INTEGER)) {
          return (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER);
        }
        return left.abilityLabel.localeCompare(right.abilityLabel);
      })
    }))
    .sort((left, right) => left.timestamp - right.timestamp);
}

function buildFilterOptions(bossTrack, classTrack, samples) {
  const bossAbilities = bossTrack.map((entry) => ({
    key: String(entry.abilityGameId),
    label: entry.abilityLabel
  }));

  const players = samples.map((sample) => ({
    key: sample.sampleId,
    label: sample.playerName || sample.sampleId
  }));

  const classAbilities = [...new Map(
    classTrack.map((entry) => [String(entry.abilityGameId), { key: String(entry.abilityGameId), label: entry.abilityLabel }])
  ).values()].sort((left, right) => left.label.localeCompare(right.label));

  return {
    bossAbilities: [...new Map(bossAbilities.map((entry) => [entry.key, entry])).values()],
    players,
    classAbilities
  };
}

function buildStudyPayload(rankings, timelinePayloads) {
  const samples = buildSampleSummary(rankings, timelinePayloads);
  const sampleMap = new Map(samples.map((sample) => [sample.sampleId, sample]));
  const bossTrack = buildBossTrack(timelinePayloads, sampleMap);
  const classTrack = buildClassTrack(timelinePayloads, sampleMap);
  const timelineRows = buildTimelineRows(bossTrack, classTrack);

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
    samples,
    filters: buildFilterOptions(bossTrack, classTrack, samples),
    bossTrack,
    classTrack,
    timelineRows
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
  getStudyOutputPath,
  getStudyOutputStem,
  writeStudyPayload
};
