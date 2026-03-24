import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  extractReportCode,
  formatTimestamp,
  getBossMappingEntry,
  getTimelineFilterSet
} = require("../scripts/wcl/utils.js");

test("extractReportCode supports url and plain code", () => {
  assert.equal(extractReportCode("https://www.warcraftlogs.com/reports/ABC123xyz"), "ABC123xyz");
  assert.equal(extractReportCode("ABC123xyz"), "ABC123xyz");
});

test("formatTimestamp converts milliseconds to m:ss", () => {
  assert.equal(formatTimestamp(14000), "0:14");
  assert.equal(formatTimestamp(125000), "2:05");
});

test("boss mapping exposes encounter metadata and aliases", () => {
  const mapping = getBossMappingEntry("元首阿福扎恩");
  assert.equal(mapping.slug, "spire_h1_afuzan");
  assert.equal(mapping.encounterId, 3176);

  const filters = getTimelineFilterSet("Imperator Averzian");
  assert.ok(filters.graphQlDataTypes.includes("Casts"));
  assert.ok(filters.whitelistAbilityNames.includes("Shadow's Advance"));
});
