import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getRankingsOutputStem,
  normalizeCharacterRankingEntry,
  parseCliArgs,
  parseRankingsOptions
} = require("../scripts/wcl/fetch-rankings.js");

test("parseRankingsOptions keeps fight mode defaults", () => {
  const options = parseRankingsOptions({});

  assert.equal(options.mode, "fight");
  assert.equal(options.size, 50);
  assert.equal(options.difficulty, 4);
  assert.equal(options.serverRegion, "CN");
});

test("parseRankingsOptions supports character mode overrides", () => {
  const options = parseRankingsOptions({
    mode: "character",
    className: "Mage",
    specName: "Fire",
    metric: "dps",
    size: "10",
    difficulty: "5",
    serverRegion: "US"
  });

  assert.equal(options.mode, "character");
  assert.equal(options.className, "Mage");
  assert.equal(options.specName, "Fire");
  assert.equal(options.heroTalent, null);
  assert.equal(options.metric, "dps");
  assert.equal(options.size, 10);
  assert.equal(options.difficulty, 5);
  assert.equal(options.serverRegion, "US");
});

test("normalizeCharacterRankingEntry extracts player ranking metadata", () => {
  const entry = normalizeCharacterRankingEntry(
    {
      name: "梅雪夜",
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
        name: "末日行者",
        region: "CN"
      }
    },
    0
  );

  assert.equal(entry.rank, 1);
  assert.equal(entry.playerName, "梅雪夜");
  assert.equal(entry.className, "Mage");
  assert.equal(entry.specName, "Fire");
  assert.equal(entry.metricValue, 87916.57);
  assert.equal(entry.reportCode, "tDFXG2BvzQ17j9gr");
  assert.equal(entry.fightId, 8);
  assert.equal(entry.server.region, "CN");
});

test("getRankingsOutputStem distinguishes character rankings files", () => {
  const stem = getRankingsOutputStem("spire_h1_afuzan", {
    mode: "character",
    difficulty: 4,
    className: "Mage",
    specName: "Fire",
    heroTalent: "Sunfury",
    metric: "dps"
  });

  assert.equal(stem, "spire_h1_afuzan-d4-mage-fire-dps-sunfury");
});

test("parseCliArgs supports long option flags", () => {
  const { positional, options } = parseCliArgs([
    "Imperator Averzian",
    "10",
    "4",
    "--mode",
    "character",
    "--class",
    "Mage",
    "--spec",
    "Fire",
    "--heroTalent",
    "Sunfury",
    "--metric",
    "dps",
    "--region",
    "CN"
  ]);

  assert.deepEqual(positional, ["Imperator Averzian", "10", "4"]);
  assert.equal(options.mode, "character");
  assert.equal(options.class, "Mage");
  assert.equal(options.spec, "Fire");
  assert.equal(options.heroTalent, "Sunfury");
  assert.equal(options.metric, "dps");
  assert.equal(options.region, "CN");
});
