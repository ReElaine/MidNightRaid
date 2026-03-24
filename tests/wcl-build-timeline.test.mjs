import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildTimelinePayload,
  buildClassTimeline,
  eventMatchesFilters,
  normalizeBossTimelineEvent
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

test("normalizeBossTimelineEvent converts fight-relative timestamps", () => {
  const normalized = normalizeBossTimelineEvent(
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

test("buildClassTimeline extracts preset friendly player skills", () => {
  const report = {
    abilityMap: new Map([[120517, "光晕"]]),
    actorMap: new Map([[3, { id: 3, name: "测试神牧", type: "Player", subType: "Priest" }]])
  };
  const fight = {
    startTime: 1000,
    friendlyPlayers: [{ id: 3 }],
    friendlyPets: [],
    enemyNPCs: []
  };
  const preset = {
    heroTalent: {
      overridesByPlayer: {},
      overridesByClassSpec: {},
      detectByClassSpec: {}
    },
    classes: {
      Priest: {
        label: "牧师",
        abilities: [{ gameId: 120517, label: "光晕", specs: ["Holy"] }]
      }
    }
  };
  const events = [{ timestamp: 15000, type: "cast", sourceID: 3, abilityGameID: 120517 }];
  const playerDetailsMap = new Map([[3, { id: 3, name: "测试神牧", className: "Priest", specName: "Holy" }]]);

  const timeline = buildClassTimeline(report, fight, events, preset, playerDetailsMap);
  assert.equal(timeline.length, 1);
  assert.equal(timeline[0].className, "Priest");
  assert.equal(timeline[0].specName, "Holy");
  assert.equal(timeline[0].abilityLabel, "光晕");
});

test("buildClassTimeline respects spec restrictions from preset", () => {
  const report = {
    abilityMap: new Map([[64843, "神圣赞美诗"]]),
    actorMap: new Map([[3, { id: 3, name: "测试神牧", type: "Player", subType: "Priest" }]])
  };
  const fight = {
    startTime: 0,
    friendlyPlayers: [{ id: 3 }],
    friendlyPets: [],
    enemyNPCs: []
  };
  const preset = {
    heroTalent: {
      overridesByPlayer: {},
      overridesByClassSpec: {},
      detectByClassSpec: {}
    },
    classes: {
      Priest: {
        label: "牧师",
        abilities: [{ gameId: 64843, label: "神圣赞美诗", specs: ["Holy"] }]
      }
    }
  };
  const playerDetailsMap = new Map([[3, { id: 3, name: "测试神牧", className: "Priest", specName: "Holy" }]]);
  const events = [{ timestamp: 5000, type: "cast", sourceID: 3, abilityGameID: 64843 }];

  const timeline = buildClassTimeline(report, fight, events, preset, playerDetailsMap);
  assert.equal(timeline.length, 1);
  assert.equal(timeline[0].abilityLabel, "神圣赞美诗");
});

test("buildTimelinePayload outputs sorted dual-lane timeline data", () => {
  const report = {
    reportCode: "RPT123",
    abilityMap: new Map([
      [1262776, "暗影进军"],
      [1249265, "幽影坍缩"],
      [120517, "光晕"]
    ]),
    actorMap: new Map([
      [38, { name: "Imperator Averzian" }],
      [3, { id: 3, name: "测试神牧", type: "Player", subType: "Priest" }]
    ])
  };
  const fight = {
    id: 12,
    bossName: "元首阿福扎恩",
    encounterId: 3176,
    difficulty: 4,
    startTime: 1000,
    endTime: 21000,
    enemyNPCs: [{ id: 38 }],
    friendlyPlayers: [{ id: 1 }, { id: 3 }],
    friendlyPets: []
  };
  const enemyEvents = [
    { timestamp: 15000, type: "cast", sourceID: 38, targetID: 1, abilityGameID: 1262776 },
    { timestamp: 5000, type: "cast", sourceID: 38, targetID: 1, abilityGameID: 1249265 }
  ];
  const friendlyEvents = [{ timestamp: 7000, type: "cast", sourceID: 3, abilityGameID: 120517 }];

  const playerDetailsMap = new Map([[3, { id: 3, name: "测试神牧", className: "Priest", specName: "Holy" }]]);
  const payload = buildTimelinePayload(report, fight, enemyEvents, friendlyEvents, playerDetailsMap);
  assert.equal(payload.reportCode, "RPT123");
  assert.equal(payload.fightId, 12);
  assert.equal(payload.bossTimeline.length, 2);
  assert.equal(payload.classTimeline.length, 1);
  assert.equal(payload.filters.specs.Priest[0].key, "Holy");
  assert.equal(payload.timeline[0].abilityName, "幽影坍缩");
  assert.equal(payload.classTimeline[0].abilityName, "光晕");
});
