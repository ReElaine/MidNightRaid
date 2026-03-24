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

function groupStudyRows(groups) {
  const rowMap = new Map();

  for (const group of groups || []) {
    for (const occurrence of group.occurrences || []) {
      const key = `${group.abilityGameId}:${occurrence.t}`;
      const current = rowMap.get(key) || {
        key,
        abilityGameId: group.abilityGameId,
        abilityLabel: group.label,
        t: occurrence.t,
        timestamp: occurrence.timestamp,
        occurrences: []
      };

      current.occurrences.push(occurrence);
      rowMap.set(key, current);
    }
  }

  return [...rowMap.values()]
    .map((row) => ({
      ...row,
      occurrences: row.occurrences.sort((left, right) => (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER))
    }))
    .sort((left, right) => left.timestamp - right.timestamp || left.abilityLabel.localeCompare(right.abilityLabel));
}

function renderBossRowEntry(row) {
  return `
    <article class="timeline-entry timeline-entry--boss">
      <div class="timeline-entry__title">${escapeHtml(row.abilityLabel)}</div>
      <div class="timeline-entry__meta">覆盖 ${row.occurrences.length} 份样本</div>
    </article>
  `;
}

function renderSampleResponse(occurrence) {
  const responses = occurrence.responses || [];
  const responseContent = responses.length
    ? responses
        .map(
          (response) => `
            <div class="sample-response__skill">
              <span class="badge">${escapeHtml(response.offsetLabel)}</span>
              <span class="badge badge--ghost">${escapeHtml(response.abilityLabel || response.abilityName)}</span>
            </div>
          `
        )
        .join("")
    : `<span class="muted">未匹配到神牧技能</span>`;

  return `
    <article class="timeline-entry timeline-entry--class">
      <div class="timeline-entry__title">
        ${escapeHtml(occurrence.playerName || occurrence.sampleId)}
        ${occurrence.rank ? `<span class="timeline-entry__rank">#${escapeHtml(occurrence.rank)}</span>` : ""}
      </div>
      <div class="timeline-entry__meta">${escapeHtml(occurrence.reportCode)} / Fight ${escapeHtml(occurrence.fightId)}</div>
      <div class="sample-response">${responseContent}</div>
    </article>
  `;
}

function renderTimelineRows(groups) {
  const rows = groupStudyRows(groups);

  if (!rows.length) {
    return `<section class="card empty-state">当前筛选条件下没有可展示的时间轴结果。</section>`;
  }

  return `
    <section class="timeline-board">
      <div class="timeline-board__head">
        <div class="timeline-board__lane timeline-board__lane--boss">Boss 技能</div>
        <div class="timeline-board__time">时间</div>
        <div class="timeline-board__lane timeline-board__lane--class">神牧技能响应</div>
      </div>
      <div class="timeline-board__body">
        ${rows
          .map(
            (row) => `
              <div class="timeline-row">
                <div class="timeline-lane timeline-lane--boss">${renderBossRowEntry(row)}</div>
                <div class="timeline-time">${escapeHtml(row.t)}</div>
                <div class="timeline-lane timeline-lane--class">${row.occurrences.map(renderSampleResponse).join("")}</div>
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

export function renderStudyDetail({ boss, study, filters, filteredGroups }) {
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
    renderChip("全部神牧技能", 'data-filter-group="classAbilities" data-filter-value="all"', filters.classAbilities.length === 0),
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
        <h2>Boss 时间轴汇总</h2>
        <p class="muted">左侧是 Boss 技能，右侧是不同神牧样本在这一波机制里的技能响应。这样可以直接横向对比不同人的处理方式。</p>
        <p class="muted">当前样本数：${escapeHtml(study.sampleCount)}，响应窗口：前 ${escapeHtml(study.responseWindow?.beforeLabel || "0:12")} / 后 ${escapeHtml(study.responseWindow?.afterLabel || "0:15")}</p>
      </section>

      <section class="detail-section filter-panel">
        <div class="section-heading">
          <div>
            <h2>筛选</h2>
            <p class="muted">保留时间轴结构，只按 Boss 技能、样本玩家和神牧技能做收窄。</p>
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
          <div class="filter-group__label">神牧技能</div>
          <div class="raid-nav">${classAbilityChips}</div>
        </div>
      </section>

      ${renderTimelineRows(filteredGroups)}
    </div>
  `;
}

export function renderErrorState(message) {
  return `<section class="card error-state">${escapeHtml(message)}</section>`;
}
