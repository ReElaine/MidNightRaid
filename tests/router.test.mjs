import test from "node:test";
import assert from "node:assert/strict";
import { cleanupBrowserGlobals, installBrowserGlobals } from "./helpers/browser-env.mjs";

test("router reads and updates query params", async () => {
  installBrowserGlobals({
    url: "https://example.com/docs/boss.html?id=spire_h1_afuzan&report=ABC123&fight=7&raid=void_spire&difficulty=%E8%8B%B1%E9%9B%84&q=test",
    bodyDataset: { page: "boss" }
  });

  const router = await import(`../docs/assets/js/router.js?test=${Date.now()}`);

  assert.equal(router.getPageName(), "boss");
  assert.equal(router.getBossId(), "spire_h1_afuzan");
  assert.equal(router.getReportCode(), "ABC123");
  assert.equal(router.getFightId(), 7);
  assert.equal(router.getActiveRaidId(), "void_spire");
  assert.equal(router.getActiveDifficulty(), "英雄");
  assert.equal(router.getSearchKeyword(), "test");

  router.updateBossUrl({ bossId: "dream_rift_h_chimerus", reportCode: "XYZ999", fightId: 3 });
  assert.match(globalThis.window.location.href, /id=dream_rift_h_chimerus/);
  assert.match(globalThis.window.location.href, /report=XYZ999/);
  assert.match(globalThis.window.location.href, /fight=3/);

  cleanupBrowserGlobals();
});
