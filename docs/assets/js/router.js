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

export function getClassName() {
  return getQueryParam("class") || "Priest";
}

export function getSpecName() {
  return getQueryParam("spec") || "Holy";
}

export function getMetric() {
  return getQueryParam("metric") || "hps";
}

export function updateIndexUrl({ bossSlug, difficulty, keyword, className, specName, metric }) {
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

  if (className) {
    url.searchParams.set("class", className);
  } else {
    url.searchParams.delete("class");
  }

  if (specName) {
    url.searchParams.set("spec", specName);
  } else {
    url.searchParams.delete("spec");
  }

  if (metric) {
    url.searchParams.set("metric", metric);
  } else {
    url.searchParams.delete("metric");
  }

  window.history.replaceState({}, "", url);
}
