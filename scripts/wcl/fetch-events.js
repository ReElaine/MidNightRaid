const { graphqlRequest } = require("./graphql");
const { REPORT_EVENTS_QUERY } = require("./queries");
const { loadFetchPolicy } = require("./utils");

async function fetchEventPages(reportCode, fightId, dataType, options = {}) {
  const policy = loadFetchPolicy();
  const events = [];
  let nextPageTimestamp = options.startTime ?? null;
  let pageCount = 0;

  while (true) {
    const data = await graphqlRequest(REPORT_EVENTS_QUERY, {
      code: reportCode,
      fightIds: [fightId],
      dataType,
      startTime: nextPageTimestamp,
      endTime: options.endTime ?? null,
      hostilityType: options.hostilityType || policy.events?.hostilityType || null,
      limit: options.limit || policy.events?.limit || 1000,
      translate: options.translate ?? policy.events?.translate ?? true
    });

    const payload = data.reportData?.report?.events;
    const pageEvents = payload?.data || [];
    events.push(...pageEvents);
    pageCount += 1;

    if (!payload?.nextPageTimestamp || payload.nextPageTimestamp === nextPageTimestamp) {
      break;
    }

    nextPageTimestamp = payload.nextPageTimestamp;
  }

  return {
    dataType,
    pageCount,
    events
  };
}

async function fetchFightEvents(reportCode, fightId, options = {}) {
  const dataTypes = options.dataTypes || ["Casts"];
  const results = [];

  for (const dataType of dataTypes) {
    results.push(await fetchEventPages(reportCode, fightId, dataType, options));
  }

  return {
    reportCode,
    fightId,
    pageCount: results.reduce((sum, item) => sum + item.pageCount, 0),
    events: results.flatMap((item) => item.events)
  };
}

async function main() {
  try {
    const [reportCode, fightIdArg, dataTypesArg] = process.argv.slice(2);
    if (reportCode === "--help" || reportCode === "-h") {
      console.log("Usage: node scripts/wcl/fetch-events.js <reportCode> <fightId> [Casts,Buffs,Debuffs]");
      return;
    }
    if (!reportCode || !fightIdArg) {
      throw new Error("Usage: node scripts/wcl/fetch-events.js <reportCode> <fightId> [Casts,Buffs,Debuffs]");
    }

    const result = await fetchFightEvents(reportCode, Number(fightIdArg), {
      dataTypes: dataTypesArg ? dataTypesArg.split(",") : ["Casts"]
    });
    console.log(JSON.stringify(result, null, 2));
    console.log(`\nSummary: fetched ${result.events.length} events in ${result.pageCount} page(s).`);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  fetchEventPages,
  fetchFightEvents
};
