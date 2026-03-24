import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildTalentProfile, detectHeroTalent, matchHeroTalentRule } = require("../scripts/wcl/hero-talents.js");

test("buildTalentProfile collects talent ids and node ids", () => {
  const profile = buildTalentProfile({
    combatantInfo: {
      talentTree: [
        { id: 101, nodeID: 201 },
        { id: 102, nodeID: 202 }
      ]
    }
  });

  assert.equal(profile.talentIds.has(101), true);
  assert.equal(profile.nodeIds.has(202), true);
});

test("matchHeroTalentRule supports any and all matching", () => {
  const profile = buildTalentProfile({
    combatantInfo: {
      talentTree: [
        { id: 101, nodeID: 201 },
        { id: 102, nodeID: 202 }
      ]
    }
  });

  assert.equal(matchHeroTalentRule(profile, { talentIdsAny: [999, 101] }), true);
  assert.equal(matchHeroTalentRule(profile, { talentIdsAll: [101, 102] }), true);
  assert.equal(matchHeroTalentRule(profile, { nodeIdsAll: [201, 999] }), false);
});

test("detectHeroTalent prefers player override then class/spec rules", () => {
  const preset = {
    heroTalent: {
      overridesByPlayer: {
        "测试法师": "日怒"
      },
      overridesByClassSpec: {
        "Mage:Frost": "霜火"
      },
      detectByClassSpec: {
        "Mage:Arcane": [
          { label: "日怒", talentIdsAny: [777001] },
          { label: "咒咏", nodeIdsAny: [888002] }
        ]
      }
    }
  };

  assert.equal(
    detectHeroTalent(
      {
        name: "测试法师",
        className: "Mage",
        specName: "Arcane",
        combatantInfo: { talentTree: [] }
      },
      preset
    ),
    "日怒"
  );

  assert.equal(
    detectHeroTalent(
      {
        name: "测试冰法",
        className: "Mage",
        specName: "Frost",
        combatantInfo: { talentTree: [] }
      },
      preset
    ),
    "霜火"
  );

  assert.equal(
    detectHeroTalent(
      {
        name: "测试奥法",
        className: "Mage",
        specName: "Arcane",
        combatantInfo: { talentTree: [{ id: 777001, nodeID: 900001 }] }
      },
      preset
    ),
    "日怒"
  );
});
