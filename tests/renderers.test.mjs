import test from "node:test";
import assert from "node:assert/strict";
import { cleanupBrowserGlobals, installBrowserGlobals } from "./helpers/browser-env.mjs";

test("renderers output boss cards and workspace sections", async () => {
  installBrowserGlobals();
  const renderers = await import(`../docs/assets/js/renderers.js?test=${Date.now()}`);

  const cards = renderers.renderBossCards(
    [
      {
        id: "spire_h1_afuzan",
        raidTitle: "虚影尖塔",
        difficulty: "英雄",
        title: "H1 元首阿福扎恩",
        summary: "测试摘要",
        jsonPath: "./data/bosses/void_spire/spire_h1_afuzan.json",
        contentPath: "content/虚影尖塔/H1-元首阿福扎恩.md"
      }
    ],
    { reportCode: "ABCD1234", fightId: 5 }
  );

  assert.match(cards, /进入 WCL 分析/);
  assert.match(cards, /report=ABCD1234/);
  assert.match(cards, /fight=5/);

  const workspace = renderers.renderBossWorkspace({
    boss: {
      id: "spire_h1_afuzan",
      raidTitle: "虚影尖塔",
      difficulty: "英雄",
      title: "H1 元首阿福扎恩",
      sourceMarkdownUrl: "https://example.com/source.md"
    },
    details: {
      title: "H1 元首阿福扎恩",
      summary: { oneLine: "一句话" },
      abilities: [{ name: "暗影进军" }],
      sources: {
        markdown: {
          label: "查看原始 Markdown",
          url: "https://example.com/source.md"
        }
      }
    },
    auth: { isAuthenticated: true },
    clientId: "client-id",
    reportCode: "ABCD1234",
    fightId: 8,
    reportSummary: { title: "测试报告" },
    fightOptions: [{ id: 8, label: "#8 元首阿福扎恩 · 击杀" }],
    analysis: {
      bossTimeline: [
        { time: "0:10", label: "暗影进军", rawAbilityName: "Shadow's Advance", sourceName: "Boss", note: "test" }
      ],
      raidCooldowns: [
        { time: "0:11", classLabel: "牧师", actorName: "Healer", abilityLabel: "真言术：障", rawAbilityName: "Power Word: Barrier" }
      ],
      classTimelines: [
        {
          classLabel: "牧师",
          entries: [{ time: "0:11", actorName: "Healer", abilityLabel: "真言术：障", targetName: "" }]
        }
      ]
    },
    loadError: ""
  });

  assert.match(workspace, /Boss 关键技能时间轴/);
  assert.match(workspace, /团队关键技能总表/);
  assert.match(workspace, /按职业拆分的关键技能时间轴/);

  cleanupBrowserGlobals();
});
