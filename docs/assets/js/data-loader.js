const INDEX_PATH = "./data/raids.json";

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeRoleTips(rawRoles, rawRoleTips) {
  if (rawRoles) {
    return {
      tank: {
        summary: rawRoles.tank?.summary || "待补充",
        tips: ensureArray(rawRoles.tank?.tips)
      },
      healer: {
        summary: rawRoles.healer?.summary || "待补充",
        tips: ensureArray(rawRoles.healer?.tips)
      },
      dps: {
        summary: rawRoles.dps?.summary || "待补充",
        tips: ensureArray(rawRoles.dps?.tips)
      }
    };
  }

  return {
    tank: {
      summary: "待补充",
      tips: ensureArray(rawRoleTips?.tank)
    },
    healer: {
      summary: "待补充",
      tips: ensureArray(rawRoleTips?.healer)
    },
    dps: {
      summary: "待补充",
      tips: ensureArray(rawRoleTips?.dps)
    }
  };
}

function normalizeAbilities(rawAbilities) {
  return ensureArray(rawAbilities).map((ability) => ({
    ...ability,
    category: ability.category || ability.type || "机制",
    severity: ability.severity || ability.importance || "待补充",
    response:
      ability.response || {
        tank: ensureArray(ability.tips),
        healer: ensureArray(ability.tips),
        dps: ensureArray(ability.tips)
      }
  }));
}

function normalizeTimeline(rawTimeline) {
  return ensureArray(rawTimeline).map((entry) => ({
    ...entry,
    label: entry.label || entry.ability || "未命名事件"
  }));
}

function normalizeSources(rawSources, rawSourceMarkdown) {
  if (rawSources?.markdown) {
    return rawSources;
  }

  return {
    markdown: rawSourceMarkdown || {
      label: "查看原始 Markdown",
      url: "#"
    }
  };
}

function normalizeQuickStart(rawQuickStart, rawPhases) {
  if (rawQuickStart) {
    return {
      bossPositioning: rawQuickStart.bossPositioning || "待补充",
      priorityTargets: ensureArray(rawQuickStart.priorityTargets),
      coreLoop: ensureArray(rawQuickStart.coreLoop),
      healingChecks: ensureArray(rawQuickStart.healingChecks),
      wipeTriggers: ensureArray(rawQuickStart.wipeTriggers)
    };
  }

  const phases = ensureArray(rawPhases);
  return {
    bossPositioning: phases[0]?.summary || "待补充",
    priorityTargets: [],
    coreLoop: phases.flatMap((phase) => ensureArray(phase.keyPoints)).slice(0, 5),
    healingChecks: [],
    wipeTriggers: []
  };
}

function normalizeSummary(rawSummary, rawOverview) {
  if (rawSummary) {
    return {
      oneLine: rawSummary.oneLine || "待补充",
      fightStyle: rawSummary.fightStyle || "待补充",
      killCondition: rawSummary.killCondition || "待补充"
    };
  }

  return {
    oneLine: rawOverview || "待补充",
    fightStyle: "待补充",
    killCondition: "待补充"
  };
}

function normalizeBossDetails(raw) {
  return {
    ...raw,
    summary: normalizeSummary(raw.summary, raw.overview),
    quickStart: normalizeQuickStart(raw.quickStart, raw.phases),
    roles: normalizeRoleTips(raw.roles, raw.roleTips),
    abilities: normalizeAbilities(raw.abilities),
    timeline: normalizeTimeline(raw.timeline),
    sources: normalizeSources(raw.sources, raw.sourceMarkdown)
  };
}

export async function loadRaidsIndex() {
  const response = await fetch(INDEX_PATH);
  if (!response.ok) {
    throw new Error("无法读取 raids.json");
  }
  return response.json();
}

export function flattenBosses(indexData) {
  return indexData.raids.flatMap((raid) =>
    raid.bosses.map((boss) => ({
      ...boss,
      raidTitle: raid.title,
      raidSlug: raid.slug,
    }))
  );
}

export async function loadBossById(id) {
  const indexData = await loadRaidsIndex();
  const boss = flattenBosses(indexData).find((item) => item.id === id);

  if (!boss) {
    throw new Error(`未找到 Boss: ${id}`);
  }

  if (!boss.jsonPath) {
    return {
      boss,
      details: null
    };
  }

  const response = await fetch(boss.jsonPath);
  if (!response.ok) {
    throw new Error(`无法读取 Boss JSON: ${boss.jsonPath}`);
  }

  return {
    boss,
    details: normalizeBossDetails(await response.json())
  };
}
