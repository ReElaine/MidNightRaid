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
  url.searchParams.set("class", options.className || "Mage");
  url.searchParams.set("spec", options.specName || "Fire");
  url.searchParams.set("metric", options.metric || "dps");
  return `${url.pathname}${url.search}`;
}

function renderResponseSummary(summary) {
  if (!summary.length) {
    return `<p class="muted">这组样本里还没有匹配到职业技能响应。</p>`;
  }

  return `
    <div class="badge-row">
      ${summary
        .map((entry) => `<span class="badge badge--ghost">${escapeHtml(entry.label)} × ${entry.count}</span>`)
        .join("")}
    </div>
  `;
}

function renderResponses(responses) {
  if (!responses.length) {
    return `<p class="muted">这个样本在当前窗口内没有匹配到职业技能。</p>`;
  }

  return `
    <div class="response-list">
      ${responses
        .map(
          (response) => `
            <article class="response-card">
              <div class="badge-row">
                <span class="badge">${escapeHtml(response.offsetLabel)}</span>
                <span class="badge badge--ghost">${escapeHtml(response.t)}</span>
                ${response.specName ? `<span class="badge badge--ghost">${escapeHtml(response.specName)}</span>` : ""}
              </div>
              <h4>${escapeHtml(response.abilityLabel || response.abilityName)}</h4>
              <p class="muted">${escapeHtml(response.sourceName || "Unknown Player")}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderOccurrenceCard(occurrence) {
  return `
    <article class="study-sample-card">
      <div class="badge-row">
        ${occurrence.rank ? `<span class="badge">排名 ${escapeHtml(occurrence.rank)}</span>` : ""}
        <span class="badge badge--ghost">${escapeHtml(occurrence.t)}</span>
        <span class="badge badge--ghost">${escapeHtml(occurrence.reportCode)} / Fight ${escapeHtml(occurrence.fightId)}</span>
      </div>
      <h4>${escapeHtml(occurrence.playerName || occurrence.sampleId)}</h4>
      <p class="muted">Boss 技能发生在 ${escapeHtml(occurrence.t)}，下面列出窗口内抓到的职业技能。</p>
      ${renderResponses(occurrence.responses || [])}
    </article>
  `;
}

function renderStudyGroup(group) {
  return `
    <section class="detail-section study-group">
      <div class="section-heading">
        <div>
          <h2>${escapeHtml(group.label)}</h2>
          <p class="muted">共覆盖 ${group.sampleCount} 份样本，方便对照同一波机制下不同人的技能选择。</p>
        </div>
      </div>
      ${renderResponseSummary(group.responseSummary || [])}
      <div class="study-sample-grid">
        ${(group.occurrences || []).map(renderOccurrenceCard).join("")}
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
            <li>聚合视角：${escapeHtml(options.className)}${options.specName ? ` / ${escapeHtml(options.specName)}` : ""} / ${escapeHtml(options.metric)}</li>
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
        <h2>Boss 汇总视角</h2>
        <p class="muted">当前汇总了 ${study.sampleCount} 份样本。每个 Boss 技能下都能看到不同玩家在响应窗口内交了什么技能。</p>
        <p class="muted">窗口范围：前 ${escapeHtml(study.responseWindow?.beforeLabel || "0:12")} / 后 ${escapeHtml(study.responseWindow?.afterLabel || "0:15")}</p>
      </section>

      <section class="detail-section filter-panel">
        <div class="section-heading">
          <div>
            <h2>筛选</h2>
            <p class="muted">按 Boss 技能、样本玩家和职业技能多选筛选，专门用来看同一波机制下大家怎么交技能。</p>
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

      ${filteredGroups.length ? filteredGroups.map(renderStudyGroup).join("") : `<section class="card empty-state">当前筛选条件下没有可展示的汇总结果。</section>`}
    </div>
  `;
}

export function renderErrorState(message) {
  return `<section class="card error-state">${escapeHtml(message)}</section>`;
}
