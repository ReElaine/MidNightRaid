const { buildTimeline } = require("./build-timeline");
const { fetchRankings } = require("./fetch-rankings");

async function main() {
  try {
    const [selector, topNArg, difficultyArg] = process.argv.slice(2);
    if (selector === "--help" || selector === "-h") {
      console.log("Usage: npm run wcl:boss -- <bossName|encounterId> [topN] [difficulty]");
      return;
    }
    if (!selector) {
      throw new Error("Usage: npm run wcl:boss -- <bossName|encounterId> [topN] [difficulty]");
    }

    const topN = Number(topNArg) || 3;
    const rankings = await fetchRankings(selector, { size: topN, difficulty: difficultyArg });
    const outputs = [];

    for (const entry of rankings.rankings.slice(0, topN)) {
      if (!entry.reportCode || !entry.fightId) {
        continue;
      }

      const timeline = await buildTimeline(entry.reportCode, entry.fightId);
      outputs.push({
        rank: entry.rank,
        reportCode: entry.reportCode,
        fightId: entry.fightId,
        bossName: timeline.bossName,
        timelineCount: timeline.timeline.length
      });
    }

    console.log(JSON.stringify({ rankingsFile: rankings.bossSlug || rankings.encounterId, outputs }, null, 2));
    console.log(`\nSummary: wrote ${outputs.length} timeline file(s) for ${rankings.bossName}.`);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}
