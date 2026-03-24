function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function encodeBossLink(boss, entry) {
  return `./boss.html?boss=${encodeURIComponent(boss.slug)}&difficulty=${encodeURIComponent(boss.difficulty || 4)}&report=${encodeURIComponent(entry.reportCode)}&fight=${encodeURIComponent(entry.fightId)}`;
}

function renderChip(label, attributes = "", isActive = false) {
  return `<button class="chip ${isActive ? "is-active" : ""}" ${attributes} type="button">${escapeHtml(label)}</button>`;
}

function dedupeOptions(items) {
  return [...new Map((items || []).map((item) => [item.key, item])).values()];
}

function groupTimelineRows(bossEntries, classEntries) {
  const map = new Map();

  for (const entry of bossEntries) {
    const row = map.get(entry.timestamp) || { timestamp: entry.timestamp, t: entry.t, bossEntries: [], classEntries: [] };
    row.bossEntries.push(entry);
    map.set(entry.timestamp, row);
  }

  for (const entry of classEntries) {
    const row = map.get(entry.timestamp) || { timestamp: entry.timestamp, t: entry.t, bossEntries: [], classEntries: [] };
    row.classEntries.push(entry);
    map.set(entry.timestamp, row);
  }

  return [...map.values()].sort((left, right) => left.timestamp - right.timestamp);
}

function renderBossEntry(entry) {
  return `
    <article class="timeline-entry timeline-entry--boss">
      <div class="timeline-entry__title">${escapeHtml(entry.abilityLabel || entry.abilityName)}</div>
      <div class="timeline-entry__meta">${escapeHtml(entry.sourceName || "Boss")}</div>
    </article>
  `;
}

function renderClassEntry(entry) {
  return `
    <article class="timeline-entry timeline-entry--class">
      <div class="timeline-entry__title">${escapeHtml(entry.classLabel || entry.className || "职业")} / ${escapeHtml(entry.abilityLabel || entry.abilityName)}</div>
      <div class="timeline-entry__meta">
        ${escapeHtml(entry.sourceName || "Unknown Player")}
        ${entry.specName ? ` / ${escapeHtml(entry.specName)}` : ""}
      </div>
    </article>
  `;
}

function renderTimelineRows(bossEntries, classEntries) {
  const rows = groupTimelineRows(bossEntries, classEntries);

  if (!rows.length) {
    return `<section class="card empty-state">当前筛选条件下没有可展示的时间轴条目。</section>`;
  }

  return `
    <section class="timeline-board">
      <div class="timeline-board__head">
        <div class="timeline-board__lane timeline-board__lane--boss">Boss 关键技能</div>
        <div class="timeline-board__time">时间</div>
        <div class="timeline-board__lane timeline-board__lane--class">职业关键技能</div>
      </div>
      <div class="timeline-board__body">
        ${rows
          .map(
            (row) => `
              <div class="timeline-row">
                <div class="timeline-lane timeline-lane--boss">${row.bossEntries.map(renderBossEntry).join("")}</div>
                <div class="timeline-time">${escapeHtml(row.t)}</div>
                <div class="timeline-lane timeline-lane--class">${row.classEntries.map(renderClassEntry).join("")}</div>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function getClassEntriesForFilterOptions(classEntries, filters) {
  return (classEntries || []).filter((entry) => {
    if (filters.className !== "all" && entry.className !== filters.className) {
      return false;
    }
    if (filters.specName !== "all" && entry.specName !== filters.specName) {
      return false;
    }
    return true;
  });
}

export function renderBossNav(bosses, activeBossSlug) {
  return bosses
    .map((boss) => renderChip(boss.shortName || boss.title, `data-boss-slug="${escapeHtml(boss.slug)}"`, activeBossSlug === boss.slug))
    .join("");
}

export function renderDifficultyNav(activeDifficulty) {
  return [
    { id: 4, label: "英雄" },
    { id: 5, label: "史诗" }
  ]
    .map((option) => renderChip(option.label, `data-difficulty="${option.id}"`, activeDifficulty === option.id))
    .join("");
}

export function renderRankingsCards(entries, boss) {
  return entries
    .map(
      (entry) => `
        <article class="card boss-card">
          <div class="badge-row">
            <span class="badge">${escapeHtml(boss.title)}</span>
            <span class="badge badge--ghost">排名 ${entry.rank}</span>
            ${entry.className ? `<span class="badge badge--ghost">${escapeHtml(entry.className)}${entry.specName ? ` / ${escapeHtml(entry.specName)}` : ""}</span>` : ""}
          </div>
          <h3>${escapeHtml(entry.playerName || entry.guild?.name || "Unknown Entry")}</h3>
          <p>${escapeHtml(entry.server?.region || "")} ${escapeHtml(entry.server?.name || "")}</p>
          <ul class="compact-list">
            <li>时长：${Math.round((entry.duration || 0) / 1000)} 秒</li>
            <li>${entry.metricValue ? `表现值：${Number(entry.metricValue).toFixed(2)}` : `治疗：${entry.healers ?? "?"} / 坦克：${entry.tanks ?? "?"}`}</li>
            <li>团队人数：${entry.size ?? "?"}${entry.deaths !== undefined && entry.deaths !== null ? ` / 死亡：${entry.deaths}` : ""}</li>
          </ul>
          <div class="boss-card__actions">
            <a class="link-button" href="${encodeBossLink(boss, entry)}">查看时间轴</a>
            <a class="link-button link-button--subtle" href="https://www.warcraftlogs.com/reports/${encodeURIComponent(entry.reportCode)}#fight=${encodeURIComponent(entry.fightId)}" target="_blank" rel="noreferrer">打开 WCL</a>
          </div>
        </article>
      `
    )
    .join("");
}

export function renderTimelineDetail({ boss, rankings, timeline, filters, filteredBossEntries, filteredClassEntries }) {
  const rankingMeta = rankings
    ? `
      <section class="card hero-card">
        <div class="badge-row">
          <span class="badge">${escapeHtml(boss.title)}</span>
          <span class="badge badge--ghost">排名 ${rankings.rank}</span>
          ${rankings.className ? `<span class="badge badge--ghost">${escapeHtml(rankings.className)}${rankings.specName ? ` / ${escapeHtml(rankings.specName)}` : ""}</span>` : ""}
        </div>
        <h2>${escapeHtml(timeline.bossName)}</h2>
        <p>${rankings.playerName ? `角色：${escapeHtml(rankings.playerName)} / ` : ""}${escapeHtml(rankings.guild?.name || "Unknown Guild")} / ${escapeHtml(rankings.server?.region || "")} ${escapeHtml(rankings.server?.name || "")}</p>
        <p class="muted">Report: ${escapeHtml(timeline.reportCode)} / Fight: ${escapeHtml(timeline.fightId)}</p>
      </section>
    `
    : `
      <section class="card hero-card">
        <div class="badge-row">
          <span class="badge">${escapeHtml(boss.title)}</span>
          <span class="badge badge--ghost">Fight ${escapeHtml(timeline.fightId)}</span>
        </div>
        <h2>${escapeHtml(timeline.bossName)}</h2>
        <p class="muted">Report: ${escapeHtml(timeline.reportCode)}</p>
      </section>
    `;

  const bossFilterChips = [
    renderChip("全部 Boss 技能", 'data-filter-group="bossAbilities" data-filter-value="all"', filters.bossAbilities.length === 0),
    ...(timeline.filters?.bossAbilities || []).map((item) =>
      renderChip(item.label, `data-filter-group="bossAbilities" data-filter-value="${escapeHtml(item.key)}"`, filters.bossAbilities.includes(item.key))
    )
  ].join("");

  const classFilterChips = [
    renderChip("全部职业", 'data-filter-group="className" data-filter-value="all"', filters.className === "all"),
    ...(timeline.filters?.classes || []).map((item) =>
      renderChip(item.label, `data-filter-group="className" data-filter-value="${escapeHtml(item.key)}"`, filters.className === item.key)
    )
  ].join("");

  const classEntriesForOptions = getClassEntriesForFilterOptions(timeline.classTimeline || [], {
    className: filters.className,
    specName: filters.specName
  });
  const specSourceEntries =
    filters.className === "all"
      ? timeline.classTimeline || []
      : (timeline.classTimeline || []).filter((entry) => entry.className === filters.className);
  const specOptions = dedupeOptions(
    specSourceEntries
      .filter((entry) => entry.specName)
      .map((entry) => ({ key: entry.specName, label: entry.specName }))
  );
  const classAbilityOptions = dedupeOptions(
    classEntriesForOptions.map((entry) => ({
      key: String(entry.abilityGameId),
      label: entry.abilityLabel
    }))
  );

  const specChips = [
    renderChip("全部专精", 'data-filter-group="specName" data-filter-value="all"', filters.specName === "all"),
    ...specOptions.map((item) =>
      renderChip(item.label, `data-filter-group="specName" data-filter-value="${escapeHtml(item.key)}"`, filters.specName === item.key)
    )
  ].join("");

  const classAbilityChips = [
    renderChip("全部职业技能", 'data-filter-group="classAbilities" data-filter-value="all"', filters.classAbilities.length === 0),
    ...classAbilityOptions.map((item) =>
      renderChip(item.label, `data-filter-group="classAbilities" data-filter-value="${escapeHtml(item.key)}"`, filters.classAbilities.includes(item.key))
    )
  ].join("");

  const activeClassFilters = [
    filters.className !== "all" ? filters.className : null,
    filters.specName !== "all" ? filters.specName : null
  ].filter(Boolean);

  return `
    <div class="detail-stack">
      ${rankingMeta}
      <section class="detail-section preset-panel">
        <div class="section-heading">
          <div>
            <h2>展示预设</h2>
            <p class="muted">${escapeHtml(timeline.presetName || "默认预设")}</p>
          </div>
          <div class="badge-row">
            <span class="badge badge--ghost">Boss 技能 ${filteredBossEntries.length}</span>
            <span class="badge badge--ghost">职业技能 ${filteredClassEntries.length}</span>
          </div>
        </div>
        <div class="preset-grid">
          <div class="info-block">
            <h3>Boss 侧预设</h3>
            <p class="muted">左侧保留 Boss 关键技能，适合抄机制主轴。</p>
          </div>
          <div class="info-block">
            <h3>职业侧预设</h3>
            <p class="muted">右侧按职业、专精和技能逐层收窄，更适合找自己的作业轴。</p>
          </div>
        </div>
      </section>
      <section class="detail-section filter-panel">
        <div class="section-heading">
          <div>
            <h2>筛选</h2>
            <p class="muted">Boss 技能和职业技能都支持多选，职业和专精仍保持单选收窄。</p>
          </div>
          ${activeClassFilters.length ? `<div class="badge-row">${activeClassFilters.map((item) => `<span class="badge badge--ghost">${escapeHtml(item)}</span>`).join("")}</div>` : ""}
        </div>
        <div class="filter-group">
          <div class="filter-group__label">Boss 技能</div>
          <div class="raid-nav">${bossFilterChips}</div>
        </div>
        <div class="filter-group">
          <div class="filter-group__label">职业</div>
          <div class="raid-nav">${classFilterChips}</div>
        </div>
        <div class="filter-group">
          <div class="filter-group__label">专精</div>
          <div class="raid-nav">${specChips}</div>
        </div>
        <div class="filter-group">
          <div class="filter-group__label">职业技能</div>
          <div class="raid-nav">${classAbilityChips}</div>
        </div>
      </section>
      ${renderTimelineRows(filteredBossEntries, filteredClassEntries)}
    </div>
  `;
}

export function renderErrorState(message) {
  return `<section class="card error-state">${escapeHtml(message)}</section>`;
}
