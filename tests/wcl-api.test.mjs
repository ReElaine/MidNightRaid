import test from "node:test";
import assert from "node:assert/strict";
import { cleanupBrowserGlobals, installBrowserGlobals } from "./helpers/browser-env.mjs";

test("wcl-api fetches report metadata and paged cast events", async () => {
  let requestCount = 0;
  installBrowserGlobals({
    fetchImpl: async (_url, options) => {
      requestCount += 1;
      const payload = JSON.parse(options.body);

      if (payload.query.includes("ReportMetadata")) {
        return {
          ok: true,
          async json() {
            return {
              data: {
                reportData: {
                  report: {
                    code: "ABCD",
                    title: "测试报告",
                    startTime: 0,
                    endTime: 1000,
                    fights: [],
                    masterData: { actors: [], abilities: [] }
                  }
                }
              }
            };
          }
        };
      }

      return {
        ok: true,
        async json() {
          return {
            data: {
              reportData: {
                report: {
                  events: requestCount === 2
                    ? {
                        data: [{ timestamp: 10, sourceID: 1, abilityGameID: 100 }],
                        nextPageTimestamp: 500
                      }
                    : {
                        data: [{ timestamp: 20, sourceID: 1, abilityGameID: 100 }],
                        nextPageTimestamp: null
                      }
                }
              }
            }
          };
        }
      };
    }
  });

  const api = await import(`../docs/assets/js/wcl-api.js?test=${Date.now()}`);
  const report = await api.fetchReportMetadata({
    graphqlUrl: "https://www.warcraftlogs.com/api/v2/user",
    accessToken: "token",
    reportCode: "ABCD"
  });
  assert.equal(report.title, "测试报告");

  const events = await api.fetchFightCastEvents({
    graphqlUrl: "https://www.warcraftlogs.com/api/v2/user",
    accessToken: "token",
    reportCode: "ABCD",
    fightId: 1,
    fightStart: 0,
    fightEnd: 1000
  });
  assert.equal(events.length, 2);

  cleanupBrowserGlobals();
});
