const https = require("https");
const { DEFAULT_RETRIES, DEFAULT_TIMEOUT_MS, WCL_V2_API_URL } = require("./config");
const { getAccessToken } = require("./auth");

async function graphqlRequest(query, variables = {}, options = {}) {
  const retries = Number.isInteger(options.retries) ? options.retries : DEFAULT_RETRIES;
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const accessToken = await getAccessToken();
      return await doGraphqlRequest(accessToken, query, variables, options.timeoutMs || DEFAULT_TIMEOUT_MS);
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  throw lastError;
}

function doGraphqlRequest(accessToken, query, variables, timeoutMs) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query, variables });
    const request = https.request(
      WCL_V2_API_URL,
      {
        method: "POST",
        timeout: timeoutMs,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`WCL GraphQL request failed: HTTP ${response.statusCode} ${response.statusMessage || ""}`.trim()));
            return;
          }

          try {
            const parsed = JSON.parse(body);
            if (parsed.errors?.length) {
              reject(new Error(parsed.errors.map((item) => item.message).join("; ")));
              return;
            }
            resolve(parsed.data);
          } catch (error) {
            reject(new Error(`Cannot parse WCL GraphQL response: ${error.message}`));
          }
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error("WCL GraphQL request timed out."));
    });
    request.on("error", reject);
    request.write(payload);
    request.end();
  });
}

module.exports = {
  graphqlRequest
};
