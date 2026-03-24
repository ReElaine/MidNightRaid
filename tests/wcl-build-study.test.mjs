import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildStudyPayload, formatOffsetLabel } = require("../scripts/wcl/build-study.js");

test("formatOffsetLabel renders signed second offsets", () => {
  assert.equal(formatOffsetLabel(-3200), "-3.2s");
  assert.equal(formatOffsetLabel(5500), "+5.5s");
});

test("buildStudyPayload groups multiple samples by boss ability", () => {
  const rankings = {
    bossSlug: "spire_h1_afuzan",
    bossName: "Imperator Averzian",
    encounterId: 3176,
    difficulty: 4,
    className: "Mage",
    specName: "Fire",
    metric: "dps",
    rankings: [
      { rank: 1, playerName: "Alice", className: "Mage", specName: "Fire", reportCode: "AAA", fightId: 1 },
      { rank: 2, playerName: "Bob", className: "Mage", specName: "Fire", reportCode: "BBB", fightId: 2 }
    ]
  };

  const timelinePayloads = [
    {
      reportCode: "AAA",
      fightId: 1,
      bossTimeline: [{ abilityGameId: 100, abilityName: "Shadow's Advance", abilityLabel: "暗影进军", timestamp: 14000, t: "0:14" }],
      classTimeline: [{ abilityGameId: 200, abilityName: "Time Warp", abilityLabel: "时间扭曲", sourceName: "Alice", className: "Mage", specName: "Fire", timestamp: 12000, t: "0:12" }]
    },
    {
      reportCode: "BBB",
      fightId: 2,
      bossTimeline: [{ abilityGameId: 100, abilityName: "Shadow's Advance", abilityLabel: "暗影进军", timestamp: 15000, t: "0:15" }],
      classTimeline: [{ abilityGameId: 201, abilityName: "Combustion", abilityLabel: "燃烧", sourceName: "Bob", className: "Mage", specName: "Fire", timestamp: 17000, t: "0:17" }]
    }
  ];

  const payload = buildStudyPayload(rankings, timelinePayloads, { windowBeforeMs: 5000, windowAfterMs: 5000 });

  assert.equal(payload.sampleCount, 2);
  assert.equal(payload.groupedAbilities.length, 1);
  assert.equal(payload.groupedAbilities[0].label, "暗影进军");
  assert.equal(payload.groupedAbilities[0].occurrences.length, 2);
  assert.equal(payload.groupedAbilities[0].responseSummary.length, 2);
  assert.equal(payload.groupedAbilities[0].occurrences[0].responses[0].offsetLabel, "-2.0s");
  assert.equal(payload.groupedAbilities[0].occurrences[1].responses[0].offsetLabel, "+2.0s");
});
