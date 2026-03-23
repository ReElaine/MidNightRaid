import test from "node:test";
import assert from "node:assert/strict";
import { cleanupBrowserGlobals, installBrowserGlobals } from "./helpers/browser-env.mjs";

test("wcl-auth stores client id and clears auth state", async () => {
  const env = installBrowserGlobals();
  const auth = await import(`../docs/assets/js/wcl-auth.js?test=${Date.now()}`);

  auth.setStoredClientId("client-123");
  assert.equal(auth.getStoredClientId({}), "client-123");

  env.localStorage.setItem(
    "midnightraid.wcl.token",
    JSON.stringify({ accessToken: "token", expiresAt: Date.now() + 60000 })
  );
  assert.equal(auth.getAccessToken(), "token");

  auth.clearAuthState();
  assert.equal(auth.getAccessToken(), "");

  cleanupBrowserGlobals();
});

test("wcl-auth completes PKCE login and stores token", async () => {
  const env = installBrowserGlobals({
    url: "https://example.com/docs/index.html?code=oauth-code&state=state-123",
    fetchImpl: async () => ({
      ok: true,
      async json() {
        return {
          access_token: "fresh-token",
          token_type: "Bearer",
          expires_in: 3600
        };
      }
    })
  });

  env.localStorage.setItem(
    "midnightraid.wcl.pkce",
    JSON.stringify({
      state: "state-123",
      codeVerifier: "verifier",
      callbackUrl: "https://example.com/docs/index.html",
      returnTo: "https://example.com/docs/boss.html?id=spire_h1_afuzan"
    })
  );

  const auth = await import(`../docs/assets/js/wcl-auth.js?test=${Date.now()}`);
  const result = await auth.completeLoginIfNeeded({
    clientId: "client-id",
    tokenUrl: "https://www.warcraftlogs.com/oauth/token"
  });

  assert.equal(result.didLogin, true);
  assert.equal(auth.getAccessToken(), "fresh-token");

  cleanupBrowserGlobals();
});
