import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildTimelinePayload,
  eventMatchesFilters,
  normalizeTimelineEvent
} = require("../scripts/wcl/build-timeline.js");

test("eventMatchesFilters excludes friendly casts and keeps whitelisted boss skills", () => {
  const actorSets = {
    friendlyIds: new Set([1, 2, 3]),
    friendlyPetIds: new Set([4]),
    enemyIds: new Set([38, 91])
  };
  const filterSet = {
    allowedEventTypes: ["cast", "applybuff", "applydebuff"],
    includeBeginCast: false,
    blacklistAbilityNames: [],
    blacklistAbilityGameIds: [],
    whitelistAbilityNames: ["Shadow's Advance"],
    whitelistAbilityGameIds: []
  };
  const abilityMap = new Map([[123, "Shadow's Advance"]]);

  assert.equal(
    eventMatchesFilters(
      { type: "cast", sourceID: 38, targetID: 2, abilityGameID: 123 },
      actorSets,
      filterSet,
      abilityMap
    ),
    true
  );

  assert.equal(
    eventMatchesFilters(
      { type: "cast", sourceID: 1, targetID: 2, abilityGameID: 123 },
      actorSets,
      filterSet,
      abilityMap
    ),
    false
  );
});

test("normalizeTimelineEvent converts fight-relative timestamps", () => {
  const normalized = normalizeTimelineEvent(
    {
      timestamp: 15000,
      type: "cast",
      sourceID: 38,
      abilityGameID: 123
    },
    { startTime: 1000 },
    new Map([[123, "Shadow's Advance"]]),
    new Map([[38, { name: "Imperator Averzian" }]])
  );

  assert.equal(normalized.timestamp, 14000);
  assert.equal(normalized.t, "0:14");
  assert.equal(normalized.abilityName, "Shadow's Advance");
  assert.equal(normalized.sourceName, "Imperator Averzian");
});

test("buildTimelinePayload outputs sorted JSON-ready timeline", () => {
  const report = {
    reportCode: "RPT123",
    abilityMap: new Map([
      [123, "Shadow's Advance"],
      [456, "Umbral Collapse"]
    ]),
    actorMap: new Map([[38, { name: "Imperator Averzian" }]])
  };
  const fight = {
    id: 12,
    bossName: "Imperator Averzian",
    encounterId: 3176,
    difficulty: 4,
    startTime: 1000,
    endTime: 21000,
    enemyNPCs: [{ id: 38 }],
    friendlyPlayers: [1],
    friendlyPets: []
  };
  const events = [
    { timestamp: 15000, type: "cast", sourceID: 38, targetID: 1, abilityGameID: 123 },
    { timestamp: 5000, type: "cast", sourceID: 38, targetID: 1, abilityGameID: 456 }
  ];

  const payload = buildTimelinePayload(report, fight, events);
  assert.equal(payload.reportCode, "RPT123");
  assert.equal(payload.fightId, 12);
  assert.equal(payload.timeline.length, 2);
  assert.equal(payload.timeline[0].abilityName, "Umbral Collapse");
  assert.equal(payload.timeline[1].abilityName, "Shadow's Advance");
});
