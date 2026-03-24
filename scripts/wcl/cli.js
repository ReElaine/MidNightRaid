const { buildTimeline, getOutputPath } = require("./build-timeline");
const { extractReportCode } = require("./utils");

async function main() {
  try {
    const [reportInput, fightSelector] = process.argv.slice(2);
    if (reportInput === "--help" || reportInput === "-h") {
      console.log("Usage: npm run wcl:fetch -- <reportCode|URL> <fightId|bossName>");
      return;
    }
    if (!reportInput || !fightSelector) {
      throw new Error("Usage: npm run wcl:fetch -- <reportCode|URL> <fightId|bossName>");
    }

    const result = await buildTimeline(reportInput, fightSelector);
    console.log(JSON.stringify(result, null, 2));
    console.log("");
    console.log(`Summary: wrote ${result.timeline.length} timeline entries for ${result.bossName} (${extractReportCode(reportInput)} / fight ${result.fightId}).`);
    console.log(`Output: ${getOutputPath(result.reportCode, result.fightId)}`);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}
