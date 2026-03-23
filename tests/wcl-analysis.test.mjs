import test from "node:test";
import assert from "node:assert/strict";

test("wcl-analysis builds fight options and aggregates boss / class timelines", async () => {
  const analysisModule = await import(`../docs/assets/js/wcl-analysis.js?test=${Date.now()}`);

  const report = {
    fights: [
      { id: 1, encounterID: 0, name: "Trash", kill: true, startTime: 0, endTime: 1000 },
      { id: 2, encounterID: 101, name: "元首阿福扎恩", kill: true, startTime: 1000, endTime: 5000 }
    ],
    masterData: {
      actors: [
        { id: 10, name: "元首阿福扎恩", type: "Boss", subType: "Boss" },
        { id: 20, name: "HolyPriest", type: "Player", subType: "Priest" }
      ],
      abilities: [
        { gameID: 1001, name: "暗影进军" },
        { gameID: 2001, name: "Power Word: Barrier" }
      ]
    }
  };

  const options = analysisModule.buildFightOptions(report);
  assert.equal(options.length, 1);
  assert.match(options[0].label, /元首阿福扎恩/);

  const result = analysisModule.analyzeFight({
    boss: { id: "spire_h1_afuzan" },
    details: {
      abilities: [{ id: "shadow_march", name: "暗影进军", category: "核心", severity: "高危" }],
      timeline: [{ label: "暗影进军 1", abilityId: "shadow_march" }]
    },
    report,
    fightId: 2,
    castEvents: [
      { timestamp: 1500, sourceID: 10, targetID: 20, abilityGameID: 1001, sourceIsFriendly: false },
      { timestamp: 2000, sourceID: 20, targetID: 20, abilityGameID: 2001, sourceIsFriendly: true }
    ],
    classConfig: {
      classes: [
        {
          id: "Priest",
          label: "牧师",
          abilities: [{ id: "barrier", label: "真言术：障", aliases: ["Power Word: Barrier", "真言术：障"] }]
        }
      ]
    }
  });

  assert.equal(result.bossTimeline.length, 1);
  assert.equal(result.bossTimeline[0].label, "暗影进军");
  assert.equal(result.raidCooldowns.length, 1);
  assert.equal(result.classTimelines[0].classLabel, "牧师");
});
