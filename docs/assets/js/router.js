export function getPageName() {
  return document.body?.dataset?.page ?? "";
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function getActiveRaidId() {
  return getQueryParam("raid") || "all";
}

export function getSearchKeyword() {
  return getQueryParam("q") || "";
}

export function getActiveDifficulty() {
  return getQueryParam("difficulty") || "all";
}

export function updateIndexUrl({ raidId, difficulty, keyword }) {
  const url = new URL(window.location.href);

  if (raidId && raidId !== "all") {
    url.searchParams.set("raid", raidId);
  } else {
    url.searchParams.delete("raid");
  }

  if (difficulty && difficulty !== "all") {
    url.searchParams.set("difficulty", difficulty);
  } else {
    url.searchParams.delete("difficulty");
  }

  if (keyword) {
    url.searchParams.set("q", keyword);
  } else {
    url.searchParams.delete("q");
  }

  window.history.replaceState({}, "", url);
}

export function getBossId() {
  return getQueryParam("id");
}

export function getReportCode() {
  return getQueryParam("report") || "";
}

export function getFightId() {
  const value = getQueryParam("fight");
  return value ? Number(value) : null;
}

export function updateBossUrl({ bossId, reportCode, fightId }) {
  const url = new URL(window.location.href);

  if (bossId) {
    url.searchParams.set("id", bossId);
  } else {
    url.searchParams.delete("id");
  }

  if (reportCode) {
    url.searchParams.set("report", reportCode);
  } else {
    url.searchParams.delete("report");
  }

  if (fightId) {
    url.searchParams.set("fight", String(fightId));
  } else {
    url.searchParams.delete("fight");
  }

  window.history.replaceState({}, "", url);
}
