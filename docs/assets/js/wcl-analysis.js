function normalize(value) {
  return String(value ?? "").trim();
}

function normalizeForMatch(value) {
  return normalize(value).toLowerCase();
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildAbilityNameMap(abilities = []) {
  return new Map(
    abilities
      .filter((ability) => ability?.gameID && ability?.name)
      .map((ability) => [Number(ability.gameID), ability.name])
  );
}

function buildActorMap(actors = []) {
  return new Map(
    actors
      .filter((actor) => actor?.id !== undefined && actor?.id !== null)
      .map((actor) => [Number(actor.id), actor])
  );
}

function formatRelativeTime(offsetMs) {
  const totalSeconds = Math.max(0, Math.floor(offsetMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function splitBossAbilityName(name) {
  return uniqueBy(
    String(name || "")
      .split(/[\/／]|与|、/)
      .map((item) => normalize(item))
      .filter(Boolean),
    (item) => item.toLowerCase()
  );
}

function normalizeTimelineLabel(label) {
  return normalize(label)
    .replace(/\s+\d+(-\d+)?$/u, "")
    .replace(/\s+\(\d+\)$/u, "")
    .trim();
}

function getEventAbilityName(event, abilityNameMap) {
  if (event?.ability?.name) {
    return event.ability.name;
  }

  if (event?.abilityGameID && abilityNameMap.has(Number(event.abilityGameID))) {
    return abilityNameMap.get(Number(event.abilityGameID));
  }

  if (event?.abilityName) {
    return event.abilityName;
  }

  return "";
}

function buildBossPreset({ boss, details }) {
  const overrideGroups = details?.wcl?.bossAbilityGroups;
  if (Array.isArray(overrideGroups) && overrideGroups.length > 0) {
    return overrideGroups;
  }

  const timelinePresets = uniqueBy(
    (details?.timeline || [])
      .map((entry) => ({
        label: normalizeTimelineLabel(entry.label),
        abilityId: entry.abilityId
      }))
      .filter((entry) => entry.label),
    (entry) => entry.label.toLowerCase()
  )
    .map((entry, index) => {
      const matchedAbility = (details?.abilities || []).find((ability) => {
        const aliases = splitBossAbilityName(ability.name).map((item) => item.toLowerCase());
        return aliases.some(
          (alias) =>
            entry.label.toLowerCase() === alias ||
            entry.label.toLowerCase().includes(alias) ||
            alias.includes(entry.label.toLowerCase())
        );
      });

      return {
        id: matchedAbility?.id || entry.abilityId || `timeline_${index + 1}`,
        label: entry.label,
        aliases: uniqueBy(
          [entry.label, ...(matchedAbility ? splitBossAbilityName(matchedAbility.name) : [])].filter(Boolean),
          (item) => item.toLowerCase()
        )
      };
    });

  if (timelinePresets.length > 0) {
    return timelinePresets;
  }

  return (details?.abilities || [])
    .filter((ability) => !/(战斗场地|场地信息|场地规则|基础信息)/u.test(`${ability.name} ${ability.category} ${ability.severity}`))
    .map((ability) => ({
      id: ability.id,
      label: ability.name,
      aliases: splitBossAbilityName(ability.name)
    }));
}

function buildBossAliasMap(groups) {
  return groups.map((group) => ({
    ...group,
    aliasesNormalized: uniqueBy(
      (group.aliases || [group.label]).map((item) => normalize(item)).filter(Boolean),
      (item) => item.toLowerCase()
    ).map((item) => normalizeForMatch(item))
  }));
}

function matchesAnyAlias(name, aliases) {
  const normalized = normalizeForMatch(name);
  return aliases.some((alias) => normalized === alias || normalized.includes(alias));
}

function getActorClass(actor) {
  return actor?.subType || actor?.type || "Unknown";
}

function resolveFriendlySource(actorMap, actor) {
  if (!actor) {
    return null;
  }

  if ((actor.type === "Pet" || actor.type === "pet") && actor.petOwner) {
    return actorMap.get(Number(actor.petOwner)) || actor;
  }

  return actor;
}

function pickFight(report, fightId) {
  const fight = (report.fights || []).find((item) => Number(item.id) === Number(fightId));
  if (!fight) {
    throw new Error(`未在报告中找到 fight=${fightId}`);
  }
  return fight;
}

export function buildFightOptions(report) {
  return (report.fights || [])
    .filter((fight) => Number(fight.encounterID) > 0)
    .map((fight) => ({
      id: Number(fight.id),
      label: `#${fight.id} ${fight.name}${fight.kill ? " · 击杀" : " · 未击杀"}`
    }));
}

export function analyzeFight({ boss, details, report, fightId, castEvents, classConfig }) {
  const fight = pickFight(report, fightId);
  const actorMap = buildActorMap(report.masterData?.actors);
  const abilityNameMap = buildAbilityNameMap(report.masterData?.abilities);
  const bossPreset = buildBossAliasMap(buildBossPreset({ boss, details }));
  const classPresets = classConfig?.classes || [];

  const bossTimeline = [];
  const raidCooldowns = [];
  const classTimelineMap = new Map();

  classPresets.forEach((classItem) => {
    classTimelineMap.set(classItem.id, {
      classId: classItem.id,
      classLabel: classItem.label,
      abilities: classItem.abilities,
      entries: []
    });
  });

  castEvents.forEach((event) => {
    const abilityName = getEventAbilityName(event, abilityNameMap);
    if (!abilityName) {
      return;
    }

    const offsetMs = Number(event.timestamp) - Number(fight.startTime);
    const rawSource = actorMap.get(Number(event.sourceID)) || null;
    const source = resolveFriendlySource(actorMap, rawSource);
    const target = actorMap.get(Number(event.targetID)) || null;
    const isFriendlySource =
      typeof event.sourceIsFriendly === "boolean"
        ? event.sourceIsFriendly
        : source?.type === "Player" || source?.type === "player";

    if (!isFriendlySource) {
      const matchedGroup = bossPreset.find((group) => matchesAnyAlias(abilityName, group.aliasesNormalized));
      if (matchedGroup) {
        bossTimeline.push({
          time: formatRelativeTime(offsetMs),
          timestamp: Number(event.timestamp),
          label: matchedGroup.label,
          rawAbilityName: abilityName,
          sourceName: source?.name || "Boss",
          targetName: target?.name || "",
          note: matchedGroup.label === abilityName ? "WCL 原始施法事件" : `匹配到 WCL 技能：${abilityName}`
        });
      }
      return;
    }

    const actorClass = getActorClass(source);
    const classState = classTimelineMap.get(actorClass);
    if (!classState) {
      return;
    }

    const matchedAbility = classState.abilities.find((ability) =>
      matchesAnyAlias(abilityName, (ability.aliases || []).map((item) => normalizeForMatch(item)))
    );

    if (!matchedAbility) {
      return;
    }

    const entry = {
      time: formatRelativeTime(offsetMs),
      timestamp: Number(event.timestamp),
      actorName: source?.name || "未知玩家",
      classId: actorClass,
      classLabel: classState.classLabel,
      abilityLabel: matchedAbility.label,
      rawAbilityName: abilityName,
      targetName: target?.name || ""
    };

    classState.entries.push(entry);
    raidCooldowns.push(entry);
  });

  const classTimelines = Array.from(classTimelineMap.values())
    .map((item) => ({
      ...item,
      entries: item.entries.sort((a, b) => a.timestamp - b.timestamp)
    }))
    .filter((item) => item.entries.length > 0);

  return {
    fight,
    report,
    boss,
    details,
    bossTimeline: bossTimeline.sort((a, b) => a.timestamp - b.timestamp),
    raidCooldowns: raidCooldowns.sort((a, b) => a.timestamp - b.timestamp),
    classTimelines
  };
}
