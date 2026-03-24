import { loadBossCatalog, loadUiConfig, loadWclStudy } from "./data-loader.js";
import { renderBossCatalogCards, renderBossNav, renderDifficultyNav, renderErrorState, renderStudyDetail } from "./renderers.js";
import { getBossSlug, getClassName, getDifficulty, getMetric, getPageName, getSearchKeyword, getSpecName, updateIndexUrl } from "./router.js";

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

function renderSelectOptions(values, selectedValue) {
  return values
    .map((item) => `<option value="${item.value}" ${item.value === selectedValue ? "selected" : ""}>${item.label}</option>`)
    .join("");
}

function buildEnabledProfiles(uiConfig) {
  return (uiConfig.classProfiles || [])
    .filter((profile) => profile.enabled !== false)
    .map((profile) => ({
      ...profile,
      specs: (profile.specs || []).filter((spec) => spec.enabled !== false)
    }))
    .filter((profile) => profile.specs.length > 0);
}

async function initIndexPage() {
  const [catalog, uiConfig] = await Promise.all([loadBossCatalog(), loadUiConfig()]);
  const profiles = buildEnabledProfiles(uiConfig);
  const bossNav = document.querySelector("#boss-nav");
  const difficultyNav = document.querySelector("#difficulty-nav");
  const searchInput = document.querySelector("#boss-search");
  const bossList = document.querySelector("#boss-list");
  const emptyState = document.querySelector("#empty-state");
  const listTitle = document.querySelector("#list-title");
  const listSummary = document.querySelector("#list-summary");
  const classSelect = document.querySelector("#class-select");
  const specSelect = document.querySelector("#spec-select");
  const metricSelect = document.querySelector("#metric-select");

  let activeBossSlug = getBossSlug() || catalog.bosses[0]?.slug || "";
  let activeDifficulty = getDifficulty();
  let keyword = normalize(getSearchKeyword());
  let className = getClassName() || profiles[0]?.className || "Priest";
  let specName = getSpecName() || profiles[0]?.specs?.[0]?.specName || "Holy";
  let metric = getMetric() || profiles[0]?.specs?.[0]?.metrics?.[0] || "hps";

  searchInput.value = keyword;

  function syncProfileOptions() {
    const activeProfile = profiles.find((profile) => profile.className === className) || profiles[0];
    const activeSpec =
      activeProfile.specs.find((spec) => spec.specName === specName) ||
      activeProfile.specs[0];

    className = activeProfile.className;
    specName = activeSpec.specName;
    metric = activeSpec.metrics.includes(metric) ? metric : activeSpec.metrics[0];

    classSelect.innerHTML = renderSelectOptions(
      profiles.map((profile) => ({ value: profile.className, label: profile.label || profile.className })),
      className
    );
    specSelect.innerHTML = renderSelectOptions(
      activeProfile.specs.map((spec) => ({ value: spec.specName, label: spec.label || spec.specName })),
      specName
    );
    metricSelect.innerHTML = renderSelectOptions(
      activeSpec.metrics.map((value) => ({ value, label: value.toUpperCase() })),
      metric
    );
  }

  function render() {
    const visibleBosses = catalog.bosses.filter((boss) => matchesKeyword(boss, keyword));
    const activeBoss = visibleBosses.find((item) => item.slug === activeBossSlug) || visibleBosses[0] || null;

    syncProfileOptions();
    bossNav.innerHTML = renderBossNav(visibleBosses, activeBoss?.slug || "");
    difficultyNav.innerHTML = renderDifficultyNav(activeDifficulty);

    if (!activeBoss) {
      bossList.innerHTML = "";
      listTitle.textContent = "没有匹配的 Boss";
      listSummary.textContent = "";
      emptyState.classList.remove("hidden");
      updateIndexUrl({ bossSlug: "", difficulty: activeDifficulty, keyword, className, specName, metric });
      return;
    }

    activeBossSlug = activeBoss.slug;
    listTitle.textContent = "Boss 汇总入口";
    listSummary.textContent = `当前按 ${className} / ${specName} / ${metric} 视角生成 Boss 汇总页。当前只启用神牧，但已经保留后续扩展其他职业的配置结构。`;
    bossList.innerHTML = renderBossCatalogCards(visibleBosses, {
      activeBossSlug: activeBoss.slug,
      difficulty: activeDifficulty,
      className,
      specName,
      metric
    });
    emptyState.classList.add("hidden");

    updateIndexUrl({ bossSlug: activeBoss.slug, difficulty: activeDifficulty, keyword, className, specName, metric });
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

  classSelect.addEventListener("change", (event) => {
    className = event.target.value;
    render();
  });

  specSelect.addEventListener("change", (event) => {
    specName = event.target.value;
    render();
  });

  metricSelect.addEventListener("change", (event) => {
    metric = event.target.value;
    render();
  });

  render();
}

async function initBossPage() {
  const bossSlug = getBossSlug();
  const difficulty = getDifficulty();
  const className = getClassName();
  const specName = getSpecName();
  const metric = getMetric();
  const titleElement = document.querySelector("#boss-page-title");
  const detailElement = document.querySelector("#boss-detail");

  if (!bossSlug) {
    titleElement.textContent = "缺少参数";
    detailElement.innerHTML = renderErrorState("URL 中缺少 boss 参数。");
    return;
  }

  try {
    const catalog = await loadBossCatalog();
    const boss = catalog.bosses.find((item) => item.slug === bossSlug);
    if (!boss) {
      throw new Error(`未找到 Boss: ${bossSlug}`);
    }

    const study = await loadWclStudy(bossSlug, difficulty, className, specName, metric);
    titleElement.textContent = `${boss.title} / ${className} / ${specName}`;

    const filterState = {
      bossAbilities: [],
      players: [],
      classAbilities: []
    };

    function render() {
      const filteredGroups = (study.groupedAbilities || [])
        .filter((group) => {
          if (filterState.bossAbilities.length > 0 && !filterState.bossAbilities.includes(String(group.abilityGameId))) {
            return false;
          }
          return true;
        })
        .map((group) => ({
          ...group,
          occurrences: (group.occurrences || [])
            .filter((occurrence) => {
              if (filterState.players.length > 0 && !filterState.players.includes(occurrence.sampleId)) {
                return false;
              }

              if (filterState.classAbilities.length > 0) {
                return (occurrence.responses || []).some((response) => filterState.classAbilities.includes(String(response.abilityGameId)));
              }

              return true;
            })
            .map((occurrence) => ({
              ...occurrence,
              responses:
                filterState.classAbilities.length > 0
                  ? (occurrence.responses || []).filter((response) => filterState.classAbilities.includes(String(response.abilityGameId)))
                  : occurrence.responses || []
            }))
        }))
        .filter((group) => group.occurrences.length > 0);

      detailElement.innerHTML = renderStudyDetail({
        boss,
        study,
        filters: filterState,
        filteredGroups
      });
    }

    detailElement.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter-group]");
      if (!button) {
        return;
      }

      const group = button.dataset.filterGroup;
      const value = button.dataset.filterValue || "all";

      if (value === "all") {
        filterState[group] = [];
        render();
        return;
      }

      const nextSet = new Set(filterState[group]);
      if (nextSet.has(value)) {
        nextSet.delete(value);
      } else {
        nextSet.add(value);
      }
      filterState[group] = [...nextSet];
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
