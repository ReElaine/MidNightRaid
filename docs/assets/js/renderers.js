function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderChip(label, attributes = "", isActive = false) {
  return `<button class="chip ${isActive ? "is-active" : ""}" ${attributes} type="button">${escapeHtml(label)}</button>`;
}

function renderStudyLink(boss, options) {
  const url = new URL("./boss.html", window.location.href);
  url.searchParams.set("boss", boss.slug);
  url.searchParams.set("difficulty", String(options.difficulty || boss.difficulty || 4));
  url.searchParams.set("class", options.className || "Priest");
  url.searchParams.set("spec", options.specName || "Holy");
  url.searchParams.set("metric", options.metric || "hps");
  return `${url.pathname}${url.search}`;
}

function renderBossTrackEntry(entry) {
  return `
    <article class="timeline-entry timeline-entry--boss">
      <div class="timeline-entry__title">${escapeHtml(entry.abilityLabel)}</div>
      <div class="timeline-entry__meta">覆盖 ${entry.sampleCount} 份样本</div>
    </article>
  `;
}

function renderClassTrackEntry(entry) {
  const playerLabel = entry.playerName || entry.sampleId;
  return `
    <article class="timeline-entry timeline-entry--class">
      <div class="timeline-entry__title">
        ${escapeHtml(entry.abilityLabel)}
        ${entry.rank ? `<span class="timeline-entry__rank">#${escapeHtml(entry.rank)}</span>` : ""}
      </div>
      <div class="timeline-entry__meta">${escapeHtml(playerLabel)} / ${escapeHtml(entry.reportCode)} / Fight ${escapeHtml(entry.fightId)}</div>
    </article>
  `;
}

function renderTimelineRows(rows) {
  if (!rows.length) {
    return `<section class="card empty-state">当前筛选条件下没有可展示的时间轴数据。</section>`;
  }

  return `
    <section class="timeline-board">
      <div class="timeline-board__head">
        <div class="timeline-board__lane timeline-board__lane--boss">Boss 技能</div>
        <div class="timeline-board__time">时间</div>
        <div class="timeline-board__lane timeline-board__lane--class">职业技能</div>
      </div>
      <div class="timeline-board__body">
        ${rows
          .map(
            (row) => `
              <div class="timeline-row">
                <div class="timeline-lane timeline-lane--boss">
                  ${row.bossEntries.length ? row.bossEntries.map(renderBossTrackEntry).join("") : `<div class="timeline-empty">-</div>`}
                </div>
                <div class="timeline-time">${escapeHtml(row.t)}</div>
                <div class="timeline-lane timeline-lane--class">
                  ${row.classEntries.length ? row.classEntries.map(renderClassTrackEntry).join("") : `<div class="timeline-empty">-</div>`}
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
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

export function renderBossCatalogCards(entries, options) {
  return entries
    .map(
      (boss) => `
        <article class="card boss-card">
          <div class="badge-row">
            <span class="badge">${escapeHtml(boss.title)}</span>
            <span class="badge badge--ghost">难度 ${escapeHtml(options.difficulty)}</span>
            ${boss.slug === options.activeBossSlug ? `<span class="badge badge--ghost">当前选择</span>` : ""}
          </div>
          <h3>${escapeHtml(boss.shortName || boss.title)}</h3>
          <p>${escapeHtml((boss.aliases || []).join(" / ") || "暂无别名")}</p>
          <ul class="compact-list">
            <li>Encounter ID: ${escapeHtml(boss.encounterId)}</li>
            <li>当前视角：${escapeHtml(options.className)}${options.specName ? ` / ${escapeHtml(options.specName)}` : ""} / ${escapeHtml(options.metric)}</li>
          </ul>
          <div class="boss-card__actions">
            <a class="link-button" href="${renderStudyLink(boss, options)}">查看 Boss 汇总页</a>
          </div>
        </article>
      `
    )
    .join("");
}

export function renderStudyDetail({ boss, study, filters, filteredRows }) {
  const bossFilterChips = [
    renderChip("全部 Boss 技能", 'data-filter-group="bossAbilities" data-filter-value="all"', filters.bossAbilities.length === 0),
    ...(study.filters?.bossAbilities || []).map((item) =>
      renderChip(item.label, `data-filter-group="bossAbilities" data-filter-value="${escapeHtml(item.key)}"`, filters.bossAbilities.includes(item.key))
    )
  ].join("");

  const playerFilterChips = [
    renderChip("全部样本", 'data-filter-group="players" data-filter-value="all"', filters.players.length === 0),
    ...(study.filters?.players || []).map((item) =>
      renderChip(item.label, `data-filter-group="players" data-filter-value="${escapeHtml(item.key)}"`, filters.players.includes(item.key))
    )
  ].join("");

  const classAbilityChips = [
    renderChip("全部职业技能", 'data-filter-group="classAbilities" data-filter-value="all"', filters.classAbilities.length === 0),
    ...(study.filters?.classAbilities || []).map((item) =>
      renderChip(item.label, `data-filter-group="classAbilities" data-filter-value="${escapeHtml(item.key)}"`, filters.classAbilities.includes(item.key))
    )
  ].join("");

  return `
    <div class="detail-stack">
      <section class="card hero-card">
        <div class="badge-row">
          <span class="badge">${escapeHtml(boss.title)}</span>
          <span class="badge badge--ghost">${escapeHtml(study.className)}${study.specName ? ` / ${escapeHtml(study.specName)}` : ""}</span>
          <span class="badge badge--ghost">${escapeHtml(study.metric)}</span>
        </div>
        <h2>Boss 双轨时间轴</h2>
        <p class="muted">左侧完整展示 Boss 技能，右侧完整展示职业技能。多份日志会汇总到同一条时间轴上，你可以自己判断每波机制下不同玩家的技能选择。</p>
        <p class="muted">当前样本数：${escapeHtml(study.sampleCount)}</p>
      </section>

      <section class="detail-section filter-panel">
        <div class="section-heading">
          <div>
            <h2>筛选</h2>
            <p class="muted">只收窄展示内容，不再做 Boss 技能和职业技能的自动匹配分析。</p>
          </div>
        </div>
        <div class="filter-group">
          <div class="filter-group__label">Boss 技能</div>
          <div class="raid-nav">${bossFilterChips}</div>
        </div>
        <div class="filter-group">
          <div class="filter-group__label">样本玩家</div>
          <div class="raid-nav">${playerFilterChips}</div>
        </div>
        <div class="filter-group">
          <div class="filter-group__label">职业技能</div>
          <div class="raid-nav">${classAbilityChips}</div>
        </div>
      </section>

      ${renderTimelineRows(filteredRows)}
    </div>
  `;
}

export function renderErrorState(message) {
  return `<section class="card error-state">${escapeHtml(message)}</section>`;
}
