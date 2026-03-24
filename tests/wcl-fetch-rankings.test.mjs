import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getRankingsOutputPath, normalizeCharacterRankingEntry } = require("../scripts/wcl/fetch-rankings.js");

test("normalizeCharacterRankingEntry extracts report metadata", () => {
  const entry = normalizeCharacterRankingEntry(
    {
      name: "Test Mage",
      class: "Mage",
      spec: "Fire",
      amount: 87916.57,
      duration: 336615,
      report: {
        code: "tDFXG2BvzQ17j9gr",
        fightID: 8,
        startTime: 1774096526856
      },
      server: {
        name: "Illidan",
        region: "US"
      }
    },
    0
  );

  assert.equal(entry.rank, 1);
  assert.equal(entry.playerName, "Test Mage");
  assert.equal(entry.className, "Mage");
  assert.equal(entry.specName, "Fire");
  assert.equal(entry.reportCode, "tDFXG2BvzQ17j9gr");
  assert.equal(entry.fightId, 8);
  assert.equal(entry.server.region, "US");
});

test("getRankingsOutputPath uses character rankings naming", () => {
  const outputPath = getRankingsOutputPath("spire_h1_afuzan", {
    difficulty: 4,
    className: "Mage",
    specName: "Fire",
    metric: "dps"
  });

  assert.match(outputPath, /rankings/);
  assert.match(outputPath, /spire_h1_afuzan-d4-mage-fire-dps\.json$/);
});
