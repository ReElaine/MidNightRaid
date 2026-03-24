const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DOCS_DATA_ROOT = path.join(REPO_ROOT, "docs", "data");
const WCL_OUTPUT_ROOT = path.join(DOCS_DATA_ROOT, "wcl");
const WCL_RANKINGS_ROOT = path.join(WCL_OUTPUT_ROOT, "rankings");
const WCL_TIMELINES_ROOT = path.join(WCL_OUTPUT_ROOT, "timelines");
const WCL_STUDIES_ROOT = path.join(WCL_OUTPUT_ROOT, "studies");
const TIMELINE_FILTERS_PATH = path.join(__dirname, "timeline-filters.json");
const TIMELINE_PRESETS_PATH = path.join(__dirname, "timeline-presets.json");
const BOSS_MAPPING_PATH = path.join(__dirname, "boss-mapping.json");
const FETCH_POLICY_PATH = path.join(__dirname, "fetch-policy.json");
const ENV_PATH = path.join(REPO_ROOT, ".env");

const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RANKINGS_PAGE_SIZE = 50;
const DEFAULT_RANKINGS_DIFFICULTY = 4;

module.exports = {
  REPO_ROOT,
  DOCS_DATA_ROOT,
  WCL_OUTPUT_ROOT,
  WCL_RANKINGS_ROOT,
  WCL_TIMELINES_ROOT,
  WCL_STUDIES_ROOT,
  TIMELINE_FILTERS_PATH,
  TIMELINE_PRESETS_PATH,
  BOSS_MAPPING_PATH,
  FETCH_POLICY_PATH,
  ENV_PATH,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_RETRIES,
  DEFAULT_RANKINGS_PAGE_SIZE,
  DEFAULT_RANKINGS_DIFFICULTY,
  WCL_V2_TOKEN_URL: "https://www.warcraftlogs.com/oauth/token",
  WCL_V2_API_URL: "https://www.warcraftlogs.com/api/v2/client"
};
