import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildAbilityMap,
  buildActorMap,
  filterFights,
  findFight,
  normalizeFight
} = require("../scripts/wcl/fetch-report.js");

test("normalizeFight keeps encounter metadata and alias data", () => {
  const fight = normalizeFight("RPT123", {
    id: 12,
    encounterID: 3176,
    name: "Imperator Averzian",
    difficulty: 4,
    kill: true,
    startTime: 1000,
    endTime: 120000,
    enemyNPCs: [],
    friendlyPlayers: [],
    friendlyPets: []
  });

  assert.equal(fight.slug, "spire_h1_afuzan");
  assert.ok(fight.aliases.includes("元首阿福扎恩"));
  assert.equal(fight.isBoss, true);
});

test("filterFights keeps only boss fights by default", () => {
  const fights = [
    { id: 1, isBoss: false },
    { id: 2, isBoss: true }
  ];

  assert.deepEqual(filterFights(fights, false), [{ id: 2, isBoss: true }]);
  assert.equal(filterFights(fights, true).length, 2);
});

test("findFight supports fight id, english name, slug and chinese alias", () => {
  const fights = [
    {
      id: 12,
      bossName: "Imperator Averzian",
      slug: "spire_h1_afuzan",
      aliases: ["元首阿福扎恩"]
    }
  ];

  assert.equal(findFight(fights, "12")?.id, 12);
  assert.equal(findFight(fights, "Imperator Averzian")?.id, 12);
  assert.equal(findFight(fights, "spire_h1_afuzan")?.id, 12);
  assert.equal(findFight(fights, "元首阿福扎恩")?.id, 12);
});

test("masterData helpers build ability and actor lookup maps", () => {
  const abilityMap = buildAbilityMap({
    abilities: [{ gameID: 123, name: "Shadow's Advance" }]
  });
  const actorMap = buildActorMap({
    actors: [{ id: 38, name: "Imperator Averzian" }]
  });

  assert.equal(abilityMap.get(123), "Shadow's Advance");
  assert.equal(actorMap.get(38).name, "Imperator Averzian");
});
