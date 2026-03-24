import { loadBossCatalog, loadWclTimeline } from "./data-loader.js";
import { renderBossCatalogCards, renderBossNav, renderDifficultyNav, renderErrorState, renderTimelineDetail } from "./renderers.js";
import { getBossSlug, getDifficulty, getFightId, getPageName, getReportCode, getSearchKeyword, updateIndexUrl } from "./router.js";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function matchesKeyword(boss, keyword) {
  if (!keyword) {
    return true;
  }

  const haystack = [boss.title, boss.shortName, boss.slug, ...(boss.aliases || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(keyword);
}

async function initIndexPage() {
  const catalog = await loadBossCatalog();
  const bossNav = document.querySelector("#boss-nav");
  const difficultyNav = document.querySelector("#difficulty-nav");
  const searchInput = document.querySelector("#boss-search");
  const bossList = document.querySelector("#boss-list");
  const emptyState = document.querySelector("#empty-state");
  const listTitle = document.querySelector("#list-title");
  const listSummary = document.querySelector("#list-summary");

  let activeBossSlug = getBossSlug() || catalog.bosses[0]?.slug || "";
  let activeDifficulty = getDifficulty();
  let keyword = normalize(getSearchKeyword());

  searchInput.value = keyword;

  function render() {
    const visibleBosses = catalog.bosses.filter((boss) => matchesKeyword(boss, keyword));
    const activeBoss = visibleBosses.find((item) => item.slug === activeBossSlug) || visibleBosses[0] || null;

    bossNav.innerHTML = renderBossNav(visibleBosses, activeBoss?.slug || "");
    difficultyNav.innerHTML = renderDifficultyNav(activeDifficulty);

    if (!activeBoss) {
      bossList.innerHTML = "";
      listTitle.textContent = "没有匹配的 Boss";
      listSummary.textContent = "";
      emptyState.classList.remove("hidden");
      updateIndexUrl({ bossSlug: "", difficulty: activeDifficulty, keyword });
      return;
    }

    activeBossSlug = activeBoss.slug;
    listTitle.textContent = "Boss 数据入口";
    listSummary.textContent = `当前聚焦 ${activeBoss.title}。首页只保留职业排名抓取入口和时间轴说明，不再展示整团排名结果。`;
    bossList.innerHTML = renderBossCatalogCards(visibleBosses, activeBoss.slug, activeDifficulty);
    emptyState.classList.add("hidden");

    updateIndexUrl({ bossSlug: activeBoss.slug, difficulty: activeDifficulty, keyword });
  }

  bossNav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-boss-slug]");
    if (!button) {
      return;
    }
    activeBossSlug = button.dataset.bossSlug;
    render();
  });

  difficultyNav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-difficulty]");
    if (!button) {
      return;
    }
    activeDifficulty = Number(button.dataset.difficulty);
    render();
  });

  searchInput.addEventListener("input", (event) => {
    keyword = normalize(event.target.value);
    render();
  });

  render();
}

async function initBossPage() {
  const bossSlug = getBossSlug();
  const reportCode = getReportCode();
  const fightId = getFightId();
  const titleElement = document.querySelector("#boss-page-title");
  const detailElement = document.querySelector("#boss-detail");

  if (!bossSlug || !reportCode || !fightId) {
    titleElement.textContent = "缺少参数";
    detailElement.innerHTML = renderErrorState("URL 中缺少 boss、report 或 fight 参数。");
    return;
  }

  try {
    const catalog = await loadBossCatalog();
    const boss = catalog.bosses.find((item) => item.slug === bossSlug);
    if (!boss) {
      throw new Error(`未找到 Boss: ${bossSlug}`);
    }

    const timeline = await loadWclTimeline(reportCode, fightId);
    titleElement.textContent = `${boss.title} / ${reportCode}`;

    const filterState = {
      bossAbilities: [],
      className: "all",
      specName: "all",
      classAbilities: []
    };

    function render() {
      const filteredBossEntries = (timeline.bossTimeline || []).filter((entry) => {
        if (filterState.bossAbilities.length > 0 && !filterState.bossAbilities.includes(String(entry.abilityGameId))) {
          return false;
        }
        return true;
      });

      const filteredClassEntries = (timeline.classTimeline || []).filter((entry) => {
        if (filterState.className !== "all" && entry.className !== filterState.className) {
          return false;
        }
        if (filterState.specName !== "all" && entry.specName !== filterState.specName) {
          return false;
        }
        if (filterState.classAbilities.length > 0 && !filterState.classAbilities.includes(String(entry.abilityGameId))) {
          return false;
        }
        return true;
      });

      detailElement.innerHTML = renderTimelineDetail({
        boss,
        rankings: null,
        timeline,
        filters: filterState,
        filteredBossEntries,
        filteredClassEntries
      });
    }

    detailElement.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter-group]");
      if (!button) {
        return;
      }

      const group = button.dataset.filterGroup;
      const value = button.dataset.filterValue || "all";

      if (group === "bossAbilities" || group === "classAbilities") {
        if (value === "all") {
          filterState[group] = [];
        } else {
          const nextSet = new Set(filterState[group]);
          if (nextSet.has(value)) {
            nextSet.delete(value);
          } else {
            nextSet.add(value);
          }
          filterState[group] = [...nextSet];
        }
        render();
        return;
      }

      filterState[group] = value;

      if (group === "className") {
        filterState.specName = "all";
        filterState.classAbilities = [];
      }

      if (group === "specName") {
        filterState.classAbilities = [];
      }

      render();
    });

    render();
  } catch (error) {
    titleElement.textContent = "加载失败";
    detailElement.innerHTML = renderErrorState(error.message);
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
    root.insertAdjacentHTML("beforeend", renderErrorState(`页面初始化失败：${error.message}`));
  }
});
