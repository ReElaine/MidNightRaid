import test from "node:test";
import assert from "node:assert/strict";
import { cleanupBrowserGlobals, installBrowserGlobals } from "./helpers/browser-env.mjs";

test("data-loader fetches and normalizes site data", async () => {
  const responses = new Map([
    [
      "./data/raids.json",
      {
        raids: [
          {
            id: "void_spire",
            title: "虚影尖塔",
            slug: "void_spire",
            bosses: [
              {
                id: "spire_h1_afuzan",
                title: "H1 元首阿福扎恩",
                difficulty: "英雄",
                summary: "test",
                raidId: "void_spire",
                contentPath: "content/虚影尖塔/H1-元首阿福扎恩.md",
                jsonPath: "./data/bosses/void_spire/spire_h1_afuzan.json",
                sourceMarkdownUrl: "https://example.com/source.md",
                tags: ["英雄"]
              }
            ]
          }
        ]
      }
    ],
    ["./data/site-config.json", { wclClientId: "abc" }],
    ["./data/class-cooldowns.json", { classes: [{ id: "Priest", label: "牧师", abilities: [] }] }],
    [
      "./data/bosses/void_spire/spire_h1_afuzan.json",
      {
        title: "H1 元首阿福扎恩",
        overview: "overview",
        roleTips: { tank: ["t"], healer: ["h"], dps: ["d"] },
        phases: [{ summary: "phase", keyPoints: ["p1"] }],
        timeline: [{ time: "0:10", ability: "暗影进军", note: "test" }],
        sourceMarkdown: { label: "md", url: "https://example.com/source.md" }
      }
    ]
  ]);

  installBrowserGlobals({
    fetchImpl: async (url) => ({
      ok: responses.has(url),
      async json() {
        return responses.get(url);
      }
    })
  });

  const loader = await import(`../docs/assets/js/data-loader.js?test=${Date.now()}`);
  const indexData = await loader.loadRaidsIndex();
  assert.equal(indexData.raids.length, 1);
  assert.equal((await loader.loadSiteConfig()).wclClientId, "abc");
  assert.equal((await loader.loadClassCooldowns()).classes[0].label, "牧师");

  const flat = loader.flattenBosses(indexData);
  assert.equal(flat[0].raidTitle, "虚影尖塔");

  const detail = await loader.loadBossById("spire_h1_afuzan");
  assert.equal(detail.details.summary.oneLine, "overview");
  assert.equal(detail.details.roles.tank.tips[0], "t");
  assert.equal(detail.details.timeline[0].label, "暗影进军");

  cleanupBrowserGlobals();
});
