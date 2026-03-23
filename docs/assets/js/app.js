import { loadBossById, loadClassCooldowns, loadRaidsIndex, loadSiteConfig, flattenBosses } from "./data-loader.js";
import { renderBossCards, renderBossWorkspace, renderDifficultyNav, renderIndexSidebar, renderRaidNav } from "./renderers.js";
import {
  getActiveDifficulty,
  getActiveRaidId,
  getBossId,
  getFightId,
  getPageName,
  getReportCode,
  getSearchKeyword,
  updateBossUrl,
  updateIndexUrl
} from "./router.js";
import { analyzeFight, buildFightOptions } from "./wcl-analysis.js";
import { fetchFightCastEvents, fetchReportMetadata } from "./wcl-api.js";
import {
  clearAuthState,
  completeLoginIfNeeded,
  getAccessToken,
  getStoredClientId,
  getTokenState,
  setStoredClientId,
  startLogin
} from "./wcl-auth.js";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function extractReportCode(input) {
  const raw = String(input ?? "").trim();
  if (!raw) {
    return "";
  }

  const reportMatch = raw.match(/reports\/([A-Za-z0-9]+)/i);
  if (reportMatch) {
    return reportMatch[1];
  }

  return raw.replace(/[^A-Za-z0-9]/g, "");
}

export function matchesKeyword(boss, keyword) {
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

async function initAuth(siteConfig) {
  const clientId = getStoredClientId(siteConfig);
  if (clientId) {
    try {
      await completeLoginIfNeeded({
        clientId,
        tokenUrl: siteConfig.oauthTokenUrl
      });
    } catch (error) {
      console.warn(error);
    }
  }

  return {
    clientId: getStoredClientId(siteConfig),
    auth: getTokenState()
  };
}

async function tryLoadReport({ siteConfig, reportCode }) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("请先连接 WCL，再读取报告。");
  }

  return fetchReportMetadata({
    graphqlUrl: siteConfig.graphqlUrl,
    accessToken,
    reportCode
  });
}

async function initIndexPage() {
  const [indexData, siteConfig] = await Promise.all([loadRaidsIndex(), loadSiteConfig()]);
  const authState = await initAuth(siteConfig);

  const navElement = document.querySelector("#raid-nav");
  const difficultyElement = document.querySelector("#difficulty-nav");
  const searchInput = document.querySelector("#boss-search");
  const bossList = document.querySelector("#boss-list");
  const emptyState = document.querySelector("#empty-state");
  const listTitle = document.querySelector("#list-title");
  const listSummary = document.querySelector("#list-summary");
  const wclSetup = document.querySelector("#wcl-setup");

  let activeRaidId = getActiveRaidId();
  let activeDifficulty = getActiveDifficulty();
  let keyword = normalize(getSearchKeyword());
  let clientId = authState.clientId;
  let reportCode = "";
  let reportSummary = null;
  let selectedFightId = null;
  let loadError = "";

  searchInput.value = keyword;

  async function loadReportAndRender(nextReportCode) {
    reportCode = extractReportCode(nextReportCode);
    loadError = "";

    if (!reportCode) {
      reportSummary = null;
      selectedFightId = null;
      render();
      return;
    }

    try {
      reportSummary = await tryLoadReport({ siteConfig, reportCode });
      const fightOptions = buildFightOptions(reportSummary);
      selectedFightId = fightOptions[0]?.id || null;
    } catch (error) {
      reportSummary = null;
      selectedFightId = null;
      loadError = error.message;
    }

    render();
  }

  function bindIndexEvents() {
    const clientIdInput = document.querySelector("#wcl-client-id");
    const loginButton = document.querySelector("#wcl-login-button");
    const logoutButton = document.querySelector("#wcl-logout-button");
    const reportInput = document.querySelector("#report-code-input");
    const loadButton = document.querySelector("#load-report-button");
    const fightSelect = document.querySelector("#fight-select");

    if (clientIdInput) {
      clientIdInput.addEventListener("change", (event) => {
        clientId = String(event.target.value || "").trim();
        setStoredClientId(clientId);
      });
    }

    if (loginButton) {
      loginButton.addEventListener("click", async () => {
        clientId = String(clientIdInput?.value || "").trim();
        setStoredClientId(clientId);
        await startLogin({
          clientId,
          authorizeUrl: siteConfig.oauthAuthorizeUrl,
          returnTo: window.location.href
        });
      });
    }

    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        clearAuthState();
        window.location.reload();
      });
    }

    if (loadButton) {
      loadButton.addEventListener("click", async () => {
        await loadReportAndRender(reportInput?.value || "");
      });
    }

    if (fightSelect) {
      fightSelect.addEventListener("change", (event) => {
        selectedFightId = event.target.value ? Number(event.target.value) : null;
        render();
      });
    }
  }

  function render() {
    navElement.innerHTML = renderRaidNav(indexData.raids, activeRaidId);
    difficultyElement.innerHTML = renderDifficultyNav(activeDifficulty);
    wclSetup.innerHTML = renderIndexSidebar({
      auth: getTokenState(),
      clientId,
      reportCode,
      reportSummary,
      selectedFightId,
      fightOptions: reportSummary ? buildFightOptions(reportSummary) : []
    });

    const allBosses = flattenBosses(indexData);
    const filteredBosses = allBosses.filter((boss) => {
      const raidMatch = activeRaidId === "all" || boss.raidId === activeRaidId;
      const difficultyMatch = activeDifficulty === "all" || boss.difficulty === activeDifficulty;
      return raidMatch && difficultyMatch && matchesKeyword(boss, keyword);
    });

    const activeRaid = indexData.raids.find((raid) => raid.id === activeRaidId);
    listTitle.textContent = activeRaid ? activeRaid.title : "全部 Boss 预设";
    listSummary.textContent = loadError
      ? `报告读取失败：${loadError}`
      : `当前展示 ${filteredBosses.length} / ${allBosses.length} 个 Boss 预设`;

    bossList.innerHTML = renderBossCards(filteredBosses, {
      reportCode,
      fightId: selectedFightId
    });
    emptyState.classList.toggle("hidden", filteredBosses.length > 0);

    updateIndexUrl({ raidId: activeRaidId, difficulty: activeDifficulty, keyword });
    bindIndexEvents();
  }

  navElement.addEventListener("click", (event) => {
    const button = event.target.closest("[data-raid-id]");
    if (!button) {
      return;
    }

    activeRaidId = button.dataset.raidId;
    render();
  });

  difficultyElement.addEventListener("click", (event) => {
    const button = event.target.closest("[data-difficulty]");
    if (!button) {
      return;
    }

    activeDifficulty = button.dataset.difficulty;
    render();
  });

  searchInput.addEventListener("input", (event) => {
    keyword = normalize(event.target.value);
    render();
  });

  render();
}

async function initBossPage() {
  const [siteConfig, classConfig] = await Promise.all([loadSiteConfig(), loadClassCooldowns()]);
  const authState = await initAuth(siteConfig);

  const bossId = getBossId();
  const initialReportCode = getReportCode();
  const initialFightId = getFightId();
  const titleElement = document.querySelector("#boss-page-title");
  const detailElement = document.querySelector("#boss-detail");

  if (!bossId) {
    titleElement.textContent = "缺少 Boss ID";
    detailElement.innerHTML = `<section class="card error-state">URL 中缺少 id 参数，无法加载对应的 WCL 分析预设。</section>`;
    return;
  }

  const { boss, details } = await loadBossById(bossId);
  titleElement.textContent = details?.title || boss.title;

  let clientId = authState.clientId;
  let reportCode = extractReportCode(initialReportCode);
  let fightId = initialFightId;
  let reportSummary = null;
  let analysis = null;
  let loadError = "";

  async function loadReport() {
    loadError = "";
    reportSummary = null;
    analysis = null;

    if (!reportCode) {
      render();
      return;
    }

    try {
      reportSummary = await tryLoadReport({ siteConfig, reportCode });
      const fightOptions = buildFightOptions(reportSummary);
      if (!fightId && fightOptions.length > 0) {
        fightId = fightOptions[0].id;
      }
      updateBossUrl({ bossId: boss.id, reportCode, fightId });
    } catch (error) {
      loadError = error.message;
    }

    render();
  }

  async function runAnalysis() {
    loadError = "";
    analysis = null;

    if (!reportCode) {
      loadError = "请先填写报告 code。";
      render();
      return;
    }

    if (!fightId) {
      loadError = "请先选择要分析的 fight。";
      render();
      return;
    }

    if (!details) {
      loadError = "当前 Boss 还没有结构化 JSON，暂时无法建立稳定的 WCL 关键技能预设。";
      render();
      return;
    }

    try {
      if (!reportSummary) {
        reportSummary = await tryLoadReport({ siteConfig, reportCode });
      }

      const fight = (reportSummary.fights || []).find((item) => Number(item.id) === Number(fightId));
      if (!fight) {
        throw new Error("选中的 fight 不存在于当前报告中。");
      }

      const castEvents = await fetchFightCastEvents({
        graphqlUrl: siteConfig.graphqlUrl,
        accessToken: getAccessToken(),
        reportCode,
        fightId,
        fightStart: Number(fight.startTime),
        fightEnd: Number(fight.endTime)
      });

      analysis = analyzeFight({
        boss,
        details,
        report: reportSummary,
        fightId,
        castEvents,
        classConfig
      });
      updateBossUrl({ bossId: boss.id, reportCode, fightId });
    } catch (error) {
      loadError = error.message;
    }

    render();
  }

  function bindBossEvents() {
    const clientIdInput = document.querySelector("#boss-client-id");
    const loginButton = document.querySelector("#boss-login-button");
    const logoutButton = document.querySelector("#boss-logout-button");
    const reportInput = document.querySelector("#boss-report-code");
    const loadReportButton = document.querySelector("#boss-load-report-button");
    const runAnalysisButton = document.querySelector("#boss-run-analysis-button");
    const fightSelect = document.querySelector("#boss-fight-select");

    clientIdInput?.addEventListener("change", (event) => {
      clientId = String(event.target.value || "").trim();
      setStoredClientId(clientId);
    });

    loginButton?.addEventListener("click", async () => {
      clientId = String(clientIdInput?.value || "").trim();
      setStoredClientId(clientId);
      await startLogin({
        clientId,
        authorizeUrl: siteConfig.oauthAuthorizeUrl,
        returnTo: window.location.href
      });
    });

    logoutButton?.addEventListener("click", () => {
      clearAuthState();
      window.location.reload();
    });

    loadReportButton?.addEventListener("click", async () => {
      reportCode = extractReportCode(reportInput?.value || "");
      await loadReport();
    });

    fightSelect?.addEventListener("change", (event) => {
      fightId = event.target.value ? Number(event.target.value) : null;
      updateBossUrl({ bossId: boss.id, reportCode, fightId });
      render();
    });

    runAnalysisButton?.addEventListener("click", async () => {
      reportCode = extractReportCode(reportInput?.value || "");
      await runAnalysis();
    });
  }

  function render() {
    detailElement.innerHTML = renderBossWorkspace({
      boss,
      details,
      auth: getTokenState(),
      clientId,
      reportCode,
      fightId,
      reportSummary,
      fightOptions: reportSummary ? buildFightOptions(reportSummary) : [],
      analysis,
      loadError
    });
    bindBossEvents();
  }

  render();

  if (reportCode && getAccessToken()) {
    await loadReport();
    if (fightId) {
      await runAnalysis();
    }
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

if (!globalThis.__MIDNIGHTRAID_TEST__) {
  main().catch((error) => {
    const root = document.querySelector("main");
    if (root) {
      root.insertAdjacentHTML(
        "beforeend",
        `<section class="card error-state">页面初始化失败：${error.message}</section>`
      );
    }
  });
}
