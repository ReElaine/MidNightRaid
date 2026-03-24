export function getPageName() {
  return document.body?.dataset?.page ?? "";
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function getBossSlug() {
  return getQueryParam("boss") || "";
}

export function getDifficulty() {
  return Number(getQueryParam("difficulty") || 4);
}

export function getSearchKeyword() {
  return getQueryParam("q") || "";
}

export function getReportCode() {
  return getQueryParam("report") || "";
}

export function getFightId() {
  return Number(getQueryParam("fight") || 0);
}

export function updateIndexUrl({ bossSlug, difficulty, keyword }) {
  const url = new URL(window.location.href);

  if (bossSlug) {
    url.searchParams.set("boss", bossSlug);
  } else {
    url.searchParams.delete("boss");
  }

  if (difficulty) {
    url.searchParams.set("difficulty", String(difficulty));
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
