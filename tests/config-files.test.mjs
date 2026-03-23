import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("WCL config and cooldown preset files are valid", async () => {
  const [siteConfigRaw, cooldownsRaw] = await Promise.all([
    readFile(new URL("../docs/data/site-config.json", import.meta.url), "utf8"),
    readFile(new URL("../docs/data/class-cooldowns.json", import.meta.url), "utf8")
  ]);

  const siteConfig = JSON.parse(siteConfigRaw);
  const cooldowns = JSON.parse(cooldownsRaw);

  assert.equal(typeof siteConfig.oauthAuthorizeUrl, "string");
  assert.equal(typeof siteConfig.oauthTokenUrl, "string");
  assert.equal(typeof siteConfig.graphqlUrl, "string");
  assert.ok(Array.isArray(cooldowns.classes));
  assert.ok(cooldowns.classes.length > 0);
});
