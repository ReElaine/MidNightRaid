import { loadBossCatalog, loadWclRankings, loadWclTimeline } from "./data-loader.js";
import { renderBossNav, renderDifficultyNav, renderErrorState, renderRankingsCards, renderTimelineDetail } from "./renderers.js";
import { getBossSlug, getDifficulty, getFightId, getPageName, getReportCode, getSearchKeyword, updateIndexUrl } from "./router.js";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function matchesKeyword(boss, keyword) {
  if (!keyword) {
    return true;
  }

  const haystack = [boss.title, boss.slug, ...(boss.aliases || []), boss.encounterName]
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
  const rankingsList = document.querySelector("#rankings-list");
  const emptyState = document.querySelector("#empty-state");
  const listTitle = document.querySelector("#list-title");
  const listSummary = document.querySelector("#list-summary");

  let activeBossSlug = getBossSlug() || catalog.bosses[0]?.slug || "";
  let activeDifficulty = getDifficulty();
  let keyword = normalize(getSearchKeyword());

  searchInput.value = keyword;

  async function render() {
    const visibleBosses = catalog.bosses.filter((boss) => matchesKeyword(boss, keyword));
    const boss = visibleBosses.find((item) => item.slug === activeBossSlug) || visibleBosses[0] || null;

    bossNav.innerHTML = renderBossNav(visibleBosses, boss?.slug || "");
    difficultyNav.innerHTML = renderDifficultyNav(activeDifficulty);

    if (!boss) {
      rankingsList.innerHTML = "";
      emptyState.classList.remove("hidden");
      listTitle.textContent = "没有匹配的 Boss";
      listSummary.textContent = "";
      updateIndexUrl({ bossSlug: "", difficulty: activeDifficulty, keyword });
      return;
    }

    activeBossSlug = boss.slug;
    listTitle.textContent = boss.title;

    try {
      const rankings = await loadWclRankings(boss.slug, activeDifficulty);
      rankingsList.innerHTML = renderRankingsCards(rankings.rankings || [], boss);
      listSummary.textContent = `当前展示 ${rankings.rankings?.length || 0} 条已抓取的高排名公开日志`;
      emptyState.classList.toggle("hidden", (rankings.rankings?.length || 0) > 0);
    } catch (error) {
      rankingsList.innerHTML = "";
      listSummary.textContent = "当前尚未生成本地 rankings JSON";
      emptyState.classList.remove("hidden");
    }

    updateIndexUrl({ bossSlug: boss.slug, difficulty: activeDifficulty, keyword });
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

  await render();
}

async function initBossPage() {
  const bossSlug = getBossSlug();
  const reportCode = getReportCode();
  const fightId = getFightId();
  const difficulty = getDifficulty();
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

    const [rankings, timeline] = await Promise.all([
      loadWclRankings(bossSlug, difficulty).catch(() => null),
      loadWclTimeline(reportCode, fightId)
    ]);

    const rankingEntry = rankings?.rankings?.find((item) => item.reportCode === reportCode && Number(item.fightId) === Number(fightId)) || null;
    titleElement.textContent = `${boss.title} / ${reportCode}`;
    detailElement.innerHTML = renderTimelineDetail({ boss, rankings: rankingEntry, timeline });
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
