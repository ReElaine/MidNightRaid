import test from "node:test";
import assert from "node:assert/strict";

test("app helpers normalize report code and search keyword matching", async () => {
  globalThis.__MIDNIGHTRAID_TEST__ = true;
  const app = await import(`../docs/assets/js/app.js?test=${Date.now()}`);

  assert.equal(app.extractReportCode("https://www.warcraftlogs.com/reports/ABcd1234#fight=5"), "ABcd1234");
  assert.equal(app.extractReportCode("AB_cd-1234"), "ABcd1234");
  assert.equal(
    app.matchesKeyword(
      {
        title: "H1 元首阿福扎恩",
        summary: "虚影尖塔首领",
        difficulty: "英雄",
        raidTitle: "虚影尖塔",
        tags: ["H1", "英雄"]
      },
      "阿福"
    ),
    true
  );
  assert.equal(
    app.matchesKeyword(
      {
        title: "H1 元首阿福扎恩",
        summary: "虚影尖塔首领",
        difficulty: "英雄",
        raidTitle: "虚影尖塔",
        tags: ["H1", "英雄"]
      },
      "奇美鲁斯"
    ),
    false
  );
});
