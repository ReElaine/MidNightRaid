const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const docsRoot = path.join(repoRoot, "docs");
const raidsIndexPath = path.join(docsRoot, "data", "raids.json");

function fail(message) {
  throw new Error(message);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readText(filePath).replace(/^\uFEFF/, ''));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/");
}

function trimEmpty(lines) {
  let start = 0;
  let end = lines.length;
  while (start < end && !lines[start].trim()) {
    start += 1;
  }
  while (end > start && !lines[end - 1].trim()) {
    end -= 1;
  }
  return lines.slice(start, end);
}

function splitTopLevelSections(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) {
        current.lines = trimEmpty(current.lines);
        sections.push(current);
      }
      current = { title: line.slice(3).trim(), lines: [] };
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  if (current) {
    current.lines = trimEmpty(current.lines);
    sections.push(current);
  }

  return sections;
}

function splitSubsections(lines) {
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith("### ")) {
      if (current) {
        current.lines = trimEmpty(current.lines);
        sections.push(current);
      }
      current = { title: line.slice(4).trim(), lines: [] };
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  if (current) {
    current.lines = trimEmpty(current.lines);
    sections.push(current);
  }

  return sections;
}

function parseParagraph(lines) {
  return trimEmpty(lines)
    .join("\n")
    .replace(/\n+/g, " ")
    .trim();
}

function parseList(lines) {
  return lines
    .map((line) => line.trim())
    .filter((line) => /^(-|\d+\.)\s+/.test(line))
    .map((line) => line.replace(/^(-|\d+\.)\s+/, "").trim());
}

function parseMetaValue(lines, prefix) {
  const line = lines.find((item) => item.trim().startsWith(prefix));
  return line ? line.trim().slice(prefix.length).trim() : "";
}

function parseRoleBlock(lines, label) {
  const index = lines.findIndex((line) => line.trim() === `${label}：`);
  if (index === -1) {
    return [];
  }

  const result = [];
  for (let i = index + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) {
      continue;
    }
    if (["Tank：", "Healer：", "DPS："].includes(line)) {
      break;
    }
    if (/^!\[.*\]\(.*\)$/.test(line)) {
      break;
    }
    if (/^-\s+/.test(line)) {
      result.push(line.replace(/^-+\s*/, "").trim());
      continue;
    }
    if (/^[A-Za-z]+：$/.test(line)) {
      break;
    }
  }

  return result;
}

function parseImages(lines) {
  return lines
    .map((line, index) => {
      const match = line.trim().match(/^!\[(.*)\]\((.*)\)$/);
      if (!match) {
        return null;
      }

      const nextLine = lines[index + 1] ? lines[index + 1].trim() : "";
      const caption = nextLine && !nextLine.startsWith("### ") && !nextLine.startsWith("Tank：") && !nextLine.startsWith("Healer：") && !nextLine.startsWith("DPS：") && !/^!\[.*\]\(.*\)$/.test(nextLine)
        ? nextLine
        : "";

      return {
        alt: match[1].trim(),
        path: match[2].trim(),
        caption
      };
    })
    .filter(Boolean);
}

function deriveAbilityId(abilityName, existingByName, index) {
  if (existingByName.has(abilityName)) {
    return existingByName.get(abilityName);
  }

  return `ability_${String(index + 1).padStart(2, "0")}`;
}

function parseSummary(section) {
  const map = new Map(splitSubsections(section.lines).map((item) => [item.title, item.lines]));
  return {
    oneLine: parseParagraph(map.get("一句话") || []),
    fightStyle: parseParagraph(map.get("战斗类型") || []),
    killCondition: parseParagraph(map.get("击杀条件") || [])
  };
}

function parseQuickStart(section) {
  const map = new Map(splitSubsections(section.lines).map((item) => [item.title, item.lines]));
  return {
    bossPositioning: parseParagraph(map.get("Boss 站位") || []),
    priorityTargets: parseList(map.get("优先目标") || []),
    coreLoop: parseList(map.get("核心循环") || []),
    healingChecks: parseList(map.get("治疗压力点") || []),
    wipeTriggers: parseList(map.get("常见灭团点") || [])
  };
}

function parseRoles(section) {
  const map = new Map(splitSubsections(section.lines).map((item) => [item.title.toLowerCase(), item.lines]));
  const roleNameMap = {
    tank: "Tank",
    healer: "Healer",
    dps: "DPS"
  };

  return Object.fromEntries(
    Object.keys(roleNameMap).map((role) => {
      const lines = map.get(role) || [];
      const summaryLine = lines.find((line) => line.trim().startsWith("职责定位：")) || "";
      const summary = summaryLine.replace("职责定位：", "").trim();
      const tips = parseList(lines);
      return [role, { summary, tips }];
    })
  );
}

function parseAbilities(section, existingJson) {
  const subsections = splitSubsections(section.lines);
  const existingByName = new Map((existingJson?.abilities || []).map((ability) => [ability.name, ability.id]));

  return subsections.map((item, index) => {
    const images = parseImages(item.lines);
    const media = images[0]
      ? {
          path: images[0].path.replace("../../docs/", "./"),
          alt: images[0].alt || item.title,
          caption: images[0].caption || undefined
        }
      : null;

    const descriptionLines = [];
    let afterMeta = false;

    for (const line of item.lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (afterMeta && descriptionLines.length > 0) {
          descriptionLines.push("");
        }
        continue;
      }
      if (trimmed.startsWith("- 分类：") || trimmed.startsWith("- 严重度：")) {
        afterMeta = true;
        continue;
      }
      if (!afterMeta) {
        continue;
      }
      if (["Tank：", "Healer：", "DPS："].includes(trimmed)) {
        break;
      }
      if (/^!\[.*\]\(.*\)$/.test(trimmed)) {
        break;
      }
      descriptionLines.push(trimmed);
    }

    return {
      id: deriveAbilityId(item.title, existingByName, index),
      name: item.title,
      category: parseMetaValue(item.lines, "- 分类："),
      severity: parseMetaValue(item.lines, "- 严重度："),
      description: parseParagraph(descriptionLines),
      response: {
        tank: parseRoleBlock(item.lines, "Tank"),
        healer: parseRoleBlock(item.lines, "Healer"),
        dps: parseRoleBlock(item.lines, "DPS")
      },
      media
    };
  });
}

function parseTimeline(section, abilities, existingJson) {
  const lines = trimEmpty(section.lines).map((line) => line.trim());
  const rows = lines.filter((line) => /^\|/.test(line));
  const dataRows = rows.slice(2);
  const existingByLabel = new Map((existingJson?.timeline || []).map((entry) => [entry.label, entry.abilityId]));

  return dataRows.map((row) => {
    const cells = row
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

    const [time, label, note] = cells;
    const matchedAbility =
      abilities
        .filter((ability) => label.startsWith(ability.name))
        .sort((a, b) => b.name.length - a.name.length)[0] || null;

    return {
      time,
      label,
      abilityId: existingByLabel.get(label) || matchedAbility?.id,
      note
    };
  });
}

function parseBossMarkdown(markdown, bossMeta, raidTitle, existingJson) {
  const sections = splitTopLevelSections(markdown);
  const sectionMap = new Map(sections.map((section) => [section.title, section]));

  const summary = parseSummary(sectionMap.get("战斗摘要") || { lines: [] });
  const quickStart = parseQuickStart(sectionMap.get("开荒速览") || { lines: [] });
  const roles = parseRoles(sectionMap.get("职责提示") || { lines: [] });
  const abilities = parseAbilities(sectionMap.get("技能详解") || { lines: [] }, existingJson);
  const timeline = parseTimeline(sectionMap.get("时间轴") || { lines: [] }, abilities, existingJson);

  return {
    id: bossMeta.id,
    raidId: bossMeta.raidId,
    raidTitle,
    title: bossMeta.title,
    difficulty: bossMeta.difficulty,
    ptr: bossMeta.ptr,
    summary,
    quickStart,
    roles,
    abilities,
    timeline,
    sources: {
      markdown: {
        label: `查看原始 Markdown：${bossMeta.contentPath}`,
        url: bossMeta.sourceMarkdownUrl
      }
    }
  };
}

function getBossTargets(targetArg) {
  const indexData = readJson(raidsIndexPath);
  const bosses = indexData.raids.flatMap((raid) =>
    raid.bosses
      .filter((boss) => boss.jsonPath)
      .map((boss) => ({
        raidTitle: raid.title,
        boss
      }))
  );

  if (!targetArg || targetArg === "--all") {
    return bosses;
  }

  const normalizedTarget = normalizePath(targetArg);
  return bosses.filter(({ boss }) => normalizePath(boss.contentPath) === normalizedTarget || boss.id === targetArg);
}

function main() {
  const targetArg = process.argv[2];
  const targets = getBossTargets(targetArg);

  if (targets.length === 0) {
    fail(`未找到可转换目标：${targetArg || "(empty)"}`);
  }

  targets.forEach(({ raidTitle, boss }) => {
    const markdownPath = path.join(repoRoot, boss.contentPath);
    const jsonPath = path.join(docsRoot, boss.jsonPath.replace("./", ""));
    const markdown = readText(markdownPath);
    const existingJson = fs.existsSync(jsonPath) ? readJson(jsonPath) : null;
    const converted = parseBossMarkdown(markdown, boss, raidTitle, existingJson);
    writeJson(jsonPath, converted);
    console.log(`Converted ${boss.contentPath} -> ${boss.jsonPath}`);
  });
}

main();




