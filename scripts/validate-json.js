const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const docsRoot = path.join(repoRoot, "docs");
const dataRoot = path.join(docsRoot, "data");
const raidsIndexPath = path.join(dataRoot, "raids.json");

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function validateBossMetadata(raid, boss) {
  const requiredFields = [
    "id",
    "title",
    "difficulty",
    "ptr",
    "summary",
    "raidId",
    "contentPath",
    "sourceMarkdownUrl"
  ];

  requiredFields.forEach((field) => {
    assert(boss[field] !== undefined && boss[field] !== null && boss[field] !== "", `${raid.id}/${boss.id || "unknown"} 缺少字段 ${field}`);
  });

  assert(boss.raidId === raid.id, `${boss.id} 的 raidId 应为 ${raid.id}`);
  assert(fs.existsSync(path.join(repoRoot, boss.contentPath)), `${boss.id} 指向的 Markdown 不存在: ${boss.contentPath}`);

  if (boss.jsonPath) {
    const bossJsonPath = path.join(docsRoot, boss.jsonPath.replace("./", ""));
    assert(fs.existsSync(bossJsonPath), `${boss.id} 指向的 Boss JSON 不存在: ${boss.jsonPath}`);
    validateBossJson(readJson(bossJsonPath), boss);
  }
}

function validateBossJson(data, bossMeta) {
  const requiredFields = [
    "id",
    "raidId",
    "raidTitle",
    "title",
    "difficulty",
    "ptr",
    "overview",
    "roleTips",
    "phases",
    "abilities",
    "timeline",
    "sourceMarkdown"
  ];

  requiredFields.forEach((field) => {
    assert(data[field] !== undefined && data[field] !== null, `${bossMeta.id} 的 JSON 缺少字段 ${field}`);
  });

  ["tank", "healer", "dps"].forEach((role) => {
    assert(Array.isArray(data.roleTips[role]) && data.roleTips[role].length > 0, `${bossMeta.id} 的 roleTips.${role} 应为非空数组`);
  });

  assert(Array.isArray(data.phases) && data.phases.length > 0, `${bossMeta.id} 的 phases 应为非空数组`);
  data.phases.forEach((phase, index) => {
    assert(phase.name && phase.summary, `${bossMeta.id} 的 phase[${index}] 缺少 name 或 summary`);
    assert(Array.isArray(phase.keyPoints) && phase.keyPoints.length > 0, `${bossMeta.id} 的 phase[${index}].keyPoints 应为非空数组`);
  });

  assert(Array.isArray(data.abilities) && data.abilities.length > 0, `${bossMeta.id} 的 abilities 应为非空数组`);
  data.abilities.forEach((ability, index) => {
    ["id", "name", "type", "description", "tips"].forEach((field) => {
      assert(ability[field] !== undefined && ability[field] !== null && ability[field] !== "", `${bossMeta.id} 的 ability[${index}] 缺少 ${field}`);
    });
    assert(Array.isArray(ability.tips) && ability.tips.length > 0, `${bossMeta.id} 的 ability[${index}].tips 应为非空数组`);
    if (ability.media) {
      assert(ability.media.path, `${bossMeta.id} 的 ability[${index}].media.path 缺失`);
      const mediaPath = path.join(docsRoot, ability.media.path.replace("./", ""));
      assert(fs.existsSync(mediaPath), `${bossMeta.id} 的 ability[${index}] 媒体资源不存在: ${ability.media.path}`);
    }
  });

  const abilityIds = new Set(data.abilities.map((ability) => ability.id));

  assert(Array.isArray(data.timeline) && data.timeline.length > 0, `${bossMeta.id} 的 timeline 应为非空数组`);
  data.timeline.forEach((entry, index) => {
    ["time", "ability", "note"].forEach((field) => {
      assert(entry[field], `${bossMeta.id} 的 timeline[${index}] 缺少 ${field}`);
    });
    if (entry.abilityId) {
      assert(abilityIds.has(entry.abilityId), `${bossMeta.id} 的 timeline[${index}].abilityId 未匹配到 abilities`);
    }
  });

  assert(data.id === bossMeta.id, `${bossMeta.id} 的详情 JSON id 不匹配`);
  assert(data.raidId === bossMeta.raidId, `${bossMeta.id} 的详情 JSON raidId 不匹配`);
}

function main() {
  assert(fs.existsSync(raidsIndexPath), "缺少 docs/data/raids.json");
  const indexData = readJson(raidsIndexPath);

  assert(Array.isArray(indexData.raids) && indexData.raids.length > 0, "raids.json 中 raids 应为非空数组");

  indexData.raids.forEach((raid) => {
    assert(raid.id && raid.title, "raids.json 中每个 raid 都需要 id 和 title");
    assert(Array.isArray(raid.bosses), `${raid.id} 的 bosses 应为数组`);
    raid.bosses.forEach((boss) => validateBossMetadata(raid, boss));
  });

  if (process.exitCode) {
    return;
  }

  console.log("JSON validation passed.");
}

main();
