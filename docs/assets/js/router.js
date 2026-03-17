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

export function updateIndexUrl({ raidId, keyword }) {
  const url = new URL(window.location.href);

  if (raidId && raidId !== "all") {
    url.searchParams.set("raid", raidId);
  } else {
    url.searchParams.delete("raid");
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
