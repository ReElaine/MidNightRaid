function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildBossAnalysisHref(bossId, reportCode, fightId) {
  const url = new URL("./boss.html", window.location.href);
  url.searchParams.set("id", bossId);

  if (reportCode) {
    url.searchParams.set("report", reportCode);
  }

  if (fightId) {
    url.searchParams.set("fight", String(fightId));
  }

  return `${url.pathname}${url.search}`;
}

function renderStatusBadge(label, tone = "default") {
  return `<span class="badge badge--${escapeHtml(tone)}">${escapeHtml(label)}</span>`;
}

export function renderRaidNav(raids, activeRaidId) {
  const allChip = `
    <button class="chip ${activeRaidId === "all" ? "is-active" : ""}" data-raid-id="all" type="button">
      全部
    </button>
  `;

  const raidChips = raids
    .map(
      (raid) => `
        <button class="chip ${activeRaidId === raid.id ? "is-active" : ""}" data-raid-id="${escapeHtml(raid.id)}" type="button">
          ${escapeHtml(raid.title)}
        </button>
      `
    )
    .join("");

  return allChip + raidChips;
}

export function renderDifficultyNav(activeDifficulty) {
  const options = [
    { id: "all", label: "全部" },
    { id: "英雄", label: "英雄" },
    { id: "史诗", label: "史诗" }
  ];

  return options
    .map(
      (option) => `
        <button class="chip ${activeDifficulty === option.id ? "is-active" : ""}" data-difficulty="${escapeHtml(option.id)}" type="button">
          ${escapeHtml(option.label)}
        </button>
      `
    )
    .join("");
}

export function renderIndexSidebar({ auth, reportCode, clientId, reportSummary, selectedFightId, fightOptions }) {
  const authText = auth.isAuthenticated ? "已连接 WCL" : "未连接 WCL";
  const authTone = auth.isAuthenticated ? "success" : "ghost";

  const fightSelect = fightOptions.length
    ? `
      <label class="search-label" for="fight-select">战斗记录</label>
      <select id="fight-select" class="search-input">
        <option value="">请选择一场战斗</option>
        ${fightOptions
          .map(
            (fight) => `
              <option value="${escapeHtml(fight.id)}" ${Number(selectedFightId) === Number(fight.id) ? "selected" : ""}>
                ${escapeHtml(fight.label)}
              </option>
            `
          )
          .join("")}
      </select>
    `
    : `<p class="muted compact-text">读取 WCL 报告后，这里会出现可分析的 fight 列表。</p>`;

  const reportMeta = reportSummary
    ? `
      <div class="meta-list compact-stack">
        ${renderStatusBadge(reportSummary.title || "未命名报告")}
        ${renderStatusBadge(`${fightOptions.length} 场 Boss 战`, "ghost")}
      </div>
      <p class="muted compact-text">报告标题：${escapeHtml(reportSummary.title || "待补充")}</p>
    `
    : `<p class="muted compact-text">支持直接粘贴 WCL 报告链接或报告代码。</p>`;

  return `
    <section>
      <h2>WCL 连接</h2>
      <div class="compact-stack">
        <div class="meta-list">
          ${renderStatusBadge(authText, authTone)}
        </div>
        <label class="search-label" for="wcl-client-id">WCL Client ID</label>
        <input
          id="wcl-client-id"
          class="search-input"
          type="text"
          value="${escapeHtml(clientId)}"
          placeholder="填写你自己的 WCL OAuth Client ID"
        >
        <p class="muted compact-text">静态站使用 PKCE 登录，不会把 client secret 放进前端。</p>
        <div class="inline-actions">
          <button id="wcl-login-button" class="link-button" type="button">${auth.isAuthenticated ? "重新登录" : "连接 WCL"}</button>
          <button id="wcl-logout-button" class="link-button link-button--subtle" type="button">清空授权</button>
        </div>
      </div>
    </section>

    <section>
      <h2>报告导入</h2>
      <div class="compact-stack">
        <label class="search-label" for="report-code-input">报告链接 / Code</label>
        <input
          id="report-code-input"
          class="search-input"
          type="text"
          value="${escapeHtml(reportCode)}"
          placeholder="例如 https://www.warcraftlogs.com/reports/XXXX 或直接填 XXXX"
        >
        <div class="inline-actions">
          <button id="load-report-button" class="link-button" type="button">读取报告</button>
        </div>
        ${reportMeta}
        ${fightSelect}
      </div>
    </section>
  `;
}

export function renderBossCards(bosses, { reportCode = "", fightId = null } = {}) {
  return bosses
    .map((boss) => {
      const canAnalyze = Boolean(boss.jsonPath);
      const action = canAnalyze
        ? `<a class="link-button" href="${escapeHtml(buildBossAnalysisHref(boss.id, reportCode, fightId))}">进入 WCL 分析</a>`
        : `<span class="link-button link-button--subtle" aria-disabled="true">WCL 预设待补充</span>`;

      return `
        <article class="card boss-card">
          <div class="badge-row">
            <span class="badge">${escapeHtml(boss.raidTitle)}</span>
            <span class="badge badge--ghost">${escapeHtml(boss.difficulty)}</span>
            ${canAnalyze ? renderStatusBadge("可分析", "success") : renderStatusBadge("待补预设", "ghost")}
          </div>
          <h3>${escapeHtml(boss.title)}</h3>
          <p>${escapeHtml(boss.summary || "暂未补充摘要。")}</p>
          <div class="boss-card__actions">
            ${action}
            <span class="muted">${escapeHtml(boss.contentPath)}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderTimelineTable(rows, columns) {
  if (!rows.length) {
    return `<section class="card empty-state">当前没有匹配到时间轴数据，请确认 report / fight / 预设是否正确。</section>`;
  }

  const head = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("");
  const body = rows
    .map(
      (row) => `
        <tr>
          ${columns
            .map((column) => `<td>${escapeHtml(row[column.key] ?? "")}</td>`)
            .join("")}
        </tr>
      `
    )
    .join("");

  return `
    <div class="timeline-table-wrap">
      <table class="timeline-table">
        <thead>
          <tr>${head}</tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

function renderClassGroups(classTimelines) {
  if (!classTimelines.length) {
    return `<section class="card empty-state">当前 fight 中没有命中职业关键技能预设，后续可以在 <code>docs/data/class-cooldowns.json</code> 继续补充。</section>`;
  }

  return classTimelines
    .map(
      (classGroup) => `
        <article class="phase-card">
          <div class="badge-row">
            <span class="badge">${escapeHtml(classGroup.classLabel)}</span>
            <span class="badge badge--ghost">${escapeHtml(String(classGroup.entries.length))} 次施放</span>
          </div>
          <ul class="event-list">
            ${classGroup.entries
              .map(
                (entry) => `
                  <li>
                    <strong>${escapeHtml(entry.time)}</strong>
                    <span>${escapeHtml(entry.actorName)}</span>
                    <span>${escapeHtml(entry.abilityLabel)}</span>
                    ${entry.targetName ? `<span class="muted">→ ${escapeHtml(entry.targetName)}</span>` : ""}
                  </li>
                `
              )
              .join("")}
          </ul>
        </article>
      `
    )
    .join("");
}

export function renderBossWorkspace({
  boss,
  details,
  auth,
  clientId,
  reportCode,
  fightId,
  reportSummary,
  fightOptions,
  analysis,
  loadError
}) {
  const presetNames = details?.abilities?.map((ability) => ability.name) || [];
  const fightSelect = fightOptions.length
    ? `
      <label class="search-label" for="boss-fight-select">Fight</label>
      <select id="boss-fight-select" class="search-input">
        <option value="">请选择战斗</option>
        ${fightOptions
          .map(
            (fight) => `
              <option value="${escapeHtml(fight.id)}" ${Number(fightId) === Number(fight.id) ? "selected" : ""}>
                ${escapeHtml(fight.label)}
              </option>
            `
          )
          .join("")}
      </select>
    `
    : `<p class="muted compact-text">先读取报告，再选择 fight。</p>`;

  const setupCard = `
    <section class="card control-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">WCL Setup</p>
          <h2>连接报告并生成时间轴</h2>
        </div>
        <div class="badge-row">
          ${renderStatusBadge(auth.isAuthenticated ? "WCL 已连接" : "WCL 未连接", auth.isAuthenticated ? "success" : "ghost")}
          ${boss.jsonPath ? renderStatusBadge("Boss 预设可用", "default") : renderStatusBadge("预设待补充", "ghost")}
        </div>
      </div>
      <div class="quickstart-grid">
        <article class="phase-card">
          <h3>授权</h3>
          <label class="search-label" for="boss-client-id">WCL Client ID</label>
          <input
            id="boss-client-id"
            class="search-input"
            type="text"
            value="${escapeHtml(clientId)}"
            placeholder="填写你自己的 WCL OAuth Client ID"
          >
          <p class="muted compact-text">静态站推荐使用 OAuth PKCE。只需要 Client ID，不需要前端保存 secret。</p>
          <div class="inline-actions">
            <button id="boss-login-button" class="link-button" type="button">${auth.isAuthenticated ? "重新登录 WCL" : "连接 WCL"}</button>
            <button id="boss-logout-button" class="link-button link-button--subtle" type="button">清空授权</button>
          </div>
        </article>
        <article class="phase-card">
          <h3>报告</h3>
          <label class="search-label" for="boss-report-code">报告链接 / Code</label>
          <input
            id="boss-report-code"
            class="search-input"
            type="text"
            value="${escapeHtml(reportCode)}"
            placeholder="粘贴 WCL 报告链接或直接填报告 code"
          >
          ${fightSelect}
          <div class="inline-actions">
            <button id="boss-load-report-button" class="link-button" type="button">读取报告</button>
            <button id="boss-run-analysis-button" class="link-button link-button--subtle" type="button">分析本场</button>
          </div>
        </article>
      </div>
    </section>
  `;

  const reportCard = reportSummary
    ? `
      <section class="card hero-card">
        <div class="badge-row">
          <span class="badge">${escapeHtml(reportSummary.title || "未命名报告")}</span>
          <span class="badge badge--ghost">${escapeHtml(String(fightOptions.length))} 场可选 Boss 战</span>
        </div>
        <h2>${escapeHtml(boss.title)}</h2>
        <p>${escapeHtml(details?.summary?.oneLine || boss.summary || "当前 Boss 还没有结构化攻略摘要。")}</p>
        <p class="muted">当前报告：${escapeHtml(reportSummary.title || reportCode)}</p>
      </section>
    `
    : `
      <section class="card hero-card">
        <div class="badge-row">
          <span class="badge">${escapeHtml(boss.raidTitle)}</span>
          <span class="badge badge--ghost">${escapeHtml(boss.difficulty)}</span>
        </div>
        <h2>${escapeHtml(boss.title)}</h2>
        <p>${escapeHtml(details?.summary?.oneLine || boss.summary || "当前 Boss 还没有结构化攻略摘要。")}</p>
      </section>
    `;

  const presetCard = `
    <section class="detail-section">
      <h2>当前 Boss 关键技能预设</h2>
      ${
        presetNames.length
          ? `<div class="badge-row">${presetNames.map((name) => renderStatusBadge(name)).join("")}</div>`
          : `<p class="muted">当前 Boss 还没有结构化技能预设，暂时不能可靠地从 WCL 中自动筛出关键 Boss 技能。</p>`
      }
      <p class="muted compact-text">预设来源优先读取当前 Boss 的结构化 JSON 技能列表；后续可以继续在 JSON 或脚本里补别名。</p>
    </section>
  `;

  const errorCard = loadError
    ? `<section class="card error-state">${escapeHtml(loadError)}</section>`
    : "";

  const analysisSections = analysis
    ? `
      <section class="detail-section">
        <h2>Boss 关键技能时间轴</h2>
        ${renderTimelineTable(analysis.bossTimeline, [
          { key: "time", label: "时间" },
          { key: "label", label: "预设技能" },
          { key: "rawAbilityName", label: "WCL 技能名" },
          { key: "sourceName", label: "施法者" },
          { key: "note", label: "备注" }
        ])}
      </section>

      <section class="detail-section">
        <h2>团队关键技能总表</h2>
        ${renderTimelineTable(analysis.raidCooldowns, [
          { key: "time", label: "时间" },
          { key: "classLabel", label: "职业" },
          { key: "actorName", label: "玩家" },
          { key: "abilityLabel", label: "预设技能" },
          { key: "rawAbilityName", label: "WCL 技能名" }
        ])}
      </section>

      <section class="detail-section">
        <h2>按职业拆分的关键技能时间轴</h2>
        <div class="phase-grid">${renderClassGroups(analysis.classTimelines)}</div>
      </section>
    `
    : "";

  const sourceCard = `
    <section class="detail-section">
      <h2>原始攻略与说明</h2>
      <p class="source-link">
        <a class="link-button link-button--subtle" href="${escapeHtml((details?.sources?.markdown?.url || boss.sourceMarkdownUrl))}" target="_blank" rel="noreferrer">
          ${escapeHtml(details?.sources?.markdown?.label || "查看原始 Markdown")}
        </a>
      </p>
    </section>
  `;

  return `
    <div class="detail-stack">
      ${reportCard}
      ${setupCard}
      ${presetCard}
      ${errorCard}
      ${analysisSections}
      ${sourceCard}
    </div>
  `;
}
