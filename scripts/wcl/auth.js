const https = require("https");
const { DEFAULT_TIMEOUT_MS, WCL_V2_TOKEN_URL } = require("./config");
const { requireV2Credentials } = require("./utils");

let tokenCache = null;

function requestAccessToken() {
  const { clientId, clientSecret } = requireV2Credentials();

  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret
    }).toString();

    const request = https.request(
      WCL_V2_TOKEN_URL,
      {
        method: "POST",
        timeout: DEFAULT_TIMEOUT_MS,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body)
        }
      },
      (response) => {
        let payload = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          payload += chunk;
        });
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`WCL OAuth failed: HTTP ${response.statusCode} ${response.statusMessage || ""}`.trim()));
            return;
          }

          try {
            const parsed = JSON.parse(payload);
            if (!parsed.access_token) {
              reject(new Error("WCL OAuth response did not include access_token."));
              return;
            }

            resolve({
              accessToken: parsed.access_token,
              expiresAt: Date.now() + Math.max(1000, (parsed.expires_in || 3600) * 1000) - 60000
            });
          } catch (error) {
            reject(new Error(`Cannot parse WCL OAuth response: ${error.message}`));
          }
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error("WCL OAuth request timed out."));
    });
    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

async function getAccessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  tokenCache = await requestAccessToken();
  return tokenCache.accessToken;
}

module.exports = {
  getAccessToken
};
