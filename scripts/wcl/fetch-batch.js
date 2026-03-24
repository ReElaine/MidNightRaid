const { buildTimeline } = require("./build-timeline");
const { fetchRankings } = require("./fetch-rankings");

function parseCliArgs(argv) {
  const positional = [];
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }

    const key = token.slice(2);
    const nextValue = argv[index + 1];
    if (!nextValue || nextValue.startsWith("--")) {
      options[key] = true;
      continue;
    }

    options[key] = nextValue;
    index += 1;
  }

  return { positional, options };
}

async function main() {
  try {
    const { positional, options } = parseCliArgs(process.argv.slice(2));
    const [selector, topNArg, difficultyArg] = positional;
    if (selector === "--help" || selector === "-h") {
      console.log("Usage: npm run wcl:boss -- <bossName|encounterId> [topN] [difficulty] [--mode fight|character] [--class Mage] [--spec Fire] [--metric dps] [--region CN]");
      return;
    }
    if (!selector) {
      throw new Error("Usage: npm run wcl:boss -- <bossName|encounterId> [topN] [difficulty] [--mode fight|character] [--class Mage] [--spec Fire] [--metric dps] [--region CN]");
    }

    const topN = Number(topNArg) || 3;
    const rankings = await fetchRankings(selector, {
      size: topN,
      difficulty: difficultyArg,
      mode: options.mode,
      className: options.class,
      specName: options.spec,
      metric: options.metric,
      serverRegion: options.region
    });
    const outputs = [];

    for (const entry of rankings.rankings.slice(0, topN)) {
      if (!entry.reportCode || !entry.fightId) {
        continue;
      }

      const timeline = await buildTimeline(entry.reportCode, entry.fightId);
      outputs.push({
        rank: entry.rank,
        playerName: entry.playerName || null,
        className: entry.className || null,
        specName: entry.specName || null,
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
