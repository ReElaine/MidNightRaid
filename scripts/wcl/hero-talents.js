function buildTalentProfile(playerDetails) {
  const talents = playerDetails?.combatantInfo?.talentTree || [];

  return {
    talentIds: new Set(talents.map((entry) => Number(entry.id)).filter(Number.isFinite)),
    nodeIds: new Set(talents.map((entry) => Number(entry.nodeID)).filter(Number.isFinite))
  };
}

function matchesNumberRuleSet(values, anyOf = [], allOf = []) {
  const anyList = (anyOf || []).map(Number).filter(Number.isFinite);
  const allList = (allOf || []).map(Number).filter(Number.isFinite);

  if (allList.length && !allList.every((value) => values.has(value))) {
    return false;
  }

  if (anyList.length && !anyList.some((value) => values.has(value))) {
    return false;
  }

  return anyList.length > 0 || allList.length > 0;
}

function matchHeroTalentRule(profile, rule = {}) {
  const matchesTalentIds = matchesNumberRuleSet(profile.talentIds, rule.talentIdsAny, rule.talentIdsAll);
  const matchesNodeIds = matchesNumberRuleSet(profile.nodeIds, rule.nodeIdsAny, rule.nodeIdsAll);

  if (rule.talentIdsAny || rule.talentIdsAll) {
    return matchesTalentIds;
  }

  if (rule.nodeIdsAny || rule.nodeIdsAll) {
    return matchesNodeIds;
  }

  return false;
}

function detectHeroTalent(playerDetails, preset = {}) {
  const playerOverrides = preset.heroTalent?.overridesByPlayer || {};
  const classSpecOverrides = preset.heroTalent?.overridesByClassSpec || {};
  const detectByClassSpec = preset.heroTalent?.detectByClassSpec || {};

  if (!playerDetails) {
    return null;
  }

  if (playerDetails.name && playerOverrides[playerDetails.name]) {
    return playerOverrides[playerDetails.name];
  }

  const classSpecKey = [playerDetails.className, playerDetails.specName].filter(Boolean).join(":");
  if (classSpecKey && classSpecOverrides[classSpecKey]) {
    return classSpecOverrides[classSpecKey];
  }

  if (!classSpecKey || !detectByClassSpec[classSpecKey]) {
    return null;
  }

  const profile = buildTalentProfile(playerDetails);
  for (const rule of detectByClassSpec[classSpecKey] || []) {
    if (matchHeroTalentRule(profile, rule)) {
      return rule.label || null;
    }
  }

  return null;
}

module.exports = {
  buildTalentProfile,
  detectHeroTalent,
  matchHeroTalentRule
};
