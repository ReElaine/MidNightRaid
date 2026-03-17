import { loadBossById, loadRaidsIndex, flattenBosses } from "./data-loader.js";
import { renderBossCards, renderBossDetail, renderRaidNav } from "./renderers.js";
import {
  getActiveRaidId,
  getBossId,
  getPageName,
  getSearchKeyword,
  updateIndexUrl
} from "./router.js";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function matchesKeyword(boss, keyword) {
  if (!keyword) {
    return true;
  }

  const haystack = [
    boss.title,
    boss.summary,
    boss.difficulty,
    boss.raidTitle,
    ...(boss.tags || [])
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(keyword);
}

async function initIndexPage() {
  const indexData = await loadRaidsIndex();
  const navElement = document.querySelector("#raid-nav");
  const searchInput = document.querySelector("#boss-search");
  const bossList = document.querySelector("#boss-list");
  const emptyState = document.querySelector("#empty-state");
  const listTitle = document.querySelector("#list-title");
  const listSummary = document.querySelector("#list-summary");

  let activeRaidId = getActiveRaidId();
  let keyword = normalize(getSearchKeyword());

  searchInput.value = keyword;

  function render() {
    navElement.innerHTML = renderRaidNav(indexData.raids, activeRaidId);

    const allBosses = flattenBosses(indexData);
    const filteredBosses = allBosses.filter((boss) => {
      const raidMatch = activeRaidId === "all" || boss.raidId === activeRaidId;
      return raidMatch && matchesKeyword(boss, keyword);
    });

    const activeRaid = indexData.raids.find((raid) => raid.id === activeRaidId);
    listTitle.textContent = activeRaid ? activeRaid.title : "全部 Boss";
    listSummary.textContent = `当前展示 ${filteredBosses.length} / ${allBosses.length} 个 Boss`;

    bossList.innerHTML = renderBossCards(filteredBosses);
    emptyState.classList.toggle("hidden", filteredBosses.length > 0);

    updateIndexUrl({ raidId: activeRaidId, keyword });
  }

  navElement.addEventListener("click", (event) => {
    const button = event.target.closest("[data-raid-id]");
    if (!button) {
      return;
    }

    activeRaidId = button.dataset.raidId;
    render();
  });

  searchInput.addEventListener("input", (event) => {
    keyword = normalize(event.target.value);
    render();
  });

  render();
}

async function initBossPage() {
  const bossId = getBossId();
  const titleElement = document.querySelector("#boss-page-title");
  const detailElement = document.querySelector("#boss-detail");

  if (!bossId) {
    titleElement.textContent = "缺少 Boss ID";
    detailElement.innerHTML = `<section class="card error-state">URL 中缺少 id 参数，无法加载对应攻略。</section>`;
    return;
  }

  try {
    const { boss, details } = await loadBossById(bossId);
    titleElement.textContent = details?.title || boss.title;
    detailElement.innerHTML = renderBossDetail(boss, details);
  } catch (error) {
    titleElement.textContent = "加载失败";
    detailElement.innerHTML = `<section class="card error-state">${error.message}</section>`;
  }
}

async function main() {
  const pageName = getPageName();
  if (pageName === "index") {
    await initIndexPage();
    return;
  }

  if (pageName === "boss") {
    await initBossPage();
  }
}

main().catch((error) => {
  const root = document.querySelector("main");
  if (root) {
    root.insertAdjacentHTML(
      "beforeend",
      `<section class="card error-state">页面初始化失败：${error.message}</section>`
    );
  }
});
