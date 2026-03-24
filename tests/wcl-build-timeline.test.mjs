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
    abilityMap: new Map([[80353, "时间扭曲"]]),
    actorMap: new Map([[3, { id: 3, name: "测试法师", type: "Player", subType: "Mage" }]])
  };
  const fight = {
    startTime: 1000,
    friendlyPlayers: [{ id: 3 }],
    friendlyPets: [],
    enemyNPCs: []
  };
  const preset = {
    heroTalent: {
      overridesByPlayer: {
        "测试法师": "日怒"
      },
      overridesByClassSpec: {},
      detectByClassSpec: {}
    },
    classes: {
      Mage: {
        label: "法师",
        abilities: [{ gameId: 80353, label: "时间扭曲" }]
      }
    }
  };
  const events = [{ timestamp: 15000, type: "cast", sourceID: 3, abilityGameID: 80353 }];
  const playerDetailsMap = new Map([[3, { id: 3, name: "测试法师", className: "Mage", specName: "Fire" }]]);

  const timeline = buildClassTimeline(report, fight, events, preset, playerDetailsMap);
  assert.equal(timeline.length, 1);
  assert.equal(timeline[0].className, "Mage");
  assert.equal(timeline[0].specName, "Fire");
  assert.equal(timeline[0].heroTalent, "日怒");
  assert.equal(timeline[0].abilityLabel, "时间扭曲");
});

test("buildClassTimeline respects spec and hero talent restrictions from preset", () => {
  const report = {
    abilityMap: new Map([[190319, "燃烧"]]),
    actorMap: new Map([[3, { id: 3, name: "测试法师", type: "Player", subType: "Mage" }]])
  };
  const fight = {
    startTime: 0,
    friendlyPlayers: [{ id: 3 }],
    friendlyPets: [],
    enemyNPCs: []
  };
  const preset = {
    heroTalent: {
      overridesByPlayer: {
        "测试法师": "日怒"
      },
      overridesByClassSpec: {},
      detectByClassSpec: {}
    },
    classes: {
      Mage: {
        label: "法师",
        abilities: [{ gameId: 190319, label: "燃烧", specs: ["Fire"], heroTalents: ["日怒"] }]
      }
    }
  };
  const playerDetailsMap = new Map([[3, { id: 3, name: "测试法师", className: "Mage", specName: "Fire" }]]);
  const events = [{ timestamp: 5000, type: "cast", sourceID: 3, abilityGameID: 190319 }];

  const timeline = buildClassTimeline(report, fight, events, preset, playerDetailsMap);
  assert.equal(timeline.length, 1);
  assert.equal(timeline[0].heroTalent, "日怒");
});

test("buildTimelinePayload outputs sorted dual-lane timeline data", () => {
  const report = {
    reportCode: "RPT123",
    abilityMap: new Map([
      [1262776, "暗影进军"],
      [1249265, "幽影坍缩"],
      [80353, "时间扭曲"]
    ]),
    actorMap: new Map([
      [38, { name: "Imperator Averzian" }],
      [3, { id: 3, name: "测试法师", type: "Player", subType: "Mage" }]
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
  const friendlyEvents = [{ timestamp: 7000, type: "cast", sourceID: 3, abilityGameID: 80353 }];

  const playerDetailsMap = new Map([[3, { id: 3, name: "测试法师", className: "Mage", specName: "Fire" }]]);
  const payload = buildTimelinePayload(report, fight, enemyEvents, friendlyEvents, playerDetailsMap);
  assert.equal(payload.reportCode, "RPT123");
  assert.equal(payload.fightId, 12);
  assert.equal(payload.bossTimeline.length, 2);
  assert.equal(payload.classTimeline.length, 1);
  assert.equal(payload.filters.specs.Mage[0].key, "Fire");
  assert.equal(payload.timeline[0].abilityName, "幽影坍缩");
  assert.equal(payload.classTimeline[0].abilityName, "时间扭曲");
});
