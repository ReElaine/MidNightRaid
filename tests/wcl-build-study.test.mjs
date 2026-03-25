import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildStudyPayload } = require("../scripts/wcl/build-study.js");

test("buildStudyPayload builds aggregated dual-track rows", () => {
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
      bossTimeline: [{ abilityGameId: 100, abilityName: "Shadow's Advance", abilityLabel: "Shadow's Advance", timestamp: 14000, t: "0:14" }],
      classTimeline: [{ abilityGameId: 200, abilityName: "Time Warp", abilityLabel: "Time Warp", sourceName: "Alice", className: "Mage", specName: "Fire", timestamp: 12000, t: "0:12" }]
    },
    {
      reportCode: "BBB",
      fightId: 2,
      bossTimeline: [{ abilityGameId: 100, abilityName: "Shadow's Advance", abilityLabel: "Shadow's Advance", timestamp: 15000, t: "0:15" }],
      classTimeline: [{ abilityGameId: 201, abilityName: "Combustion", abilityLabel: "Combustion", sourceName: "Bob", className: "Mage", specName: "Fire", timestamp: 17000, t: "0:17" }]
    }
  ];

  const payload = buildStudyPayload(rankings, timelinePayloads);

  assert.equal(payload.sampleCount, 2);
  assert.equal(payload.bossTrack.length, 2);
  assert.equal(payload.classTrack.length, 2);
  assert.deepEqual(
    payload.timelineRows.map((row) => row.t),
    ["0:12", "0:14", "0:15", "0:17"]
  );
  assert.equal(payload.timelineRows[0].classEntries[0].playerName, "Alice");
  assert.equal(payload.timelineRows[1].bossEntries[0].abilityLabel, "Shadow's Advance");
  assert.equal(payload.timelineRows[1].bossEntries[0].playerName, "Alice");
  assert.equal(payload.timelineRows[1].bossEntries[0].sourceLabel, "Alice #1");
  assert.equal(payload.timelineRows[3].classEntries[0].abilityLabel, "Combustion");
  assert.equal(payload.filters.classAbilities.length, 2);
});
