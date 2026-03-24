import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getRankingsOutputPath, normalizeRankingEntry } = require("../scripts/wcl/fetch-rankings.js");

test("normalizeRankingEntry extracts report metadata", () => {
  const entry = normalizeRankingEntry(
    {
      duration: 163742,
      startTime: 1774071393219,
      bracketData: 258.926,
      report: {
        code: "9nFBwKkAQHpcrWqh",
        fightID: 1,
        startTime: 1774071141233
      },
      server: { name: "Illidan", region: "US" },
      guild: { name: "MassivePennyIsLifestyle" }
    },
    0
  );

  assert.equal(entry.rank, 1);
  assert.equal(entry.reportCode, "9nFBwKkAQHpcrWqh");
  assert.equal(entry.fightId, 1);
  assert.equal(entry.server.name, "Illidan");
});

test("getRankingsOutputPath uses rankings subdirectory and difficulty suffix", () => {
  const outputPath = getRankingsOutputPath("spire_h1_afuzan", 4);
  assert.match(outputPath, /rankings/);
  assert.match(outputPath, /spire_h1_afuzan-d4\.json$/);
});
