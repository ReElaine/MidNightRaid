function buildGraphQLBody(query, variables) {
  return JSON.stringify({ query, variables });
}

async function runQuery({ graphqlUrl, accessToken, query, variables }) {
  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: buildGraphQLBody(query, variables)
  });

  if (!response.ok) {
    throw new Error(`WCL 请求失败：HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((item) => item.message).join("；"));
  }

  return payload.data;
}

const REPORT_METADATA_QUERY = `
  query ReportMetadata($code: String!) {
    reportData {
      report(code: $code) {
        code
        title
        startTime
        endTime
        owner {
          name
        }
        fights {
          id
          encounterID
          name
          kill
          difficulty
          startTime
          endTime
        }
        masterData {
          actors {
            id
            gameID
            name
            type
            subType
            petOwner
          }
          abilities {
            gameID
            name
          }
        }
      }
    }
  }
`;

const REPORT_CASTS_QUERY = `
  query ReportCasts($code: String!, $fightIDs: [Int!], $startTime: Float, $endTime: Float) {
    reportData {
      report(code: $code) {
        events(dataType: Casts, fightIDs: $fightIDs, startTime: $startTime, endTime: $endTime) {
          data
          nextPageTimestamp
        }
      }
    }
  }
`;

export async function fetchReportMetadata({ graphqlUrl, accessToken, reportCode }) {
  const data = await runQuery({
    graphqlUrl,
    accessToken,
    query: REPORT_METADATA_QUERY,
    variables: { code: reportCode }
  });

  const report = data?.reportData?.report;
  if (!report) {
    throw new Error("未找到该 WCL 报告，请确认报告代码是否正确。");
  }

  return report;
}

export async function fetchFightCastEvents({
  graphqlUrl,
  accessToken,
  reportCode,
  fightId,
  fightStart,
  fightEnd
}) {
  const events = [];
  let cursor = fightStart;

  while (cursor < fightEnd) {
    const data = await runQuery({
      graphqlUrl,
      accessToken,
      query: REPORT_CASTS_QUERY,
      variables: {
        code: reportCode,
        fightIDs: [fightId],
        startTime: cursor,
        endTime: fightEnd
      }
    });

    const page = data?.reportData?.report?.events;
    const pageEvents = Array.isArray(page?.data) ? page.data : [];
    events.push(...pageEvents);

    if (!page?.nextPageTimestamp || page.nextPageTimestamp <= cursor) {
      break;
    }

    cursor = page.nextPageTimestamp;
  }

  return events;
}
