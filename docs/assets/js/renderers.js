function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderBossNav(bosses, activeBossSlug) {
  return bosses
    .map(
      (boss) => `
        <button class="chip ${activeBossSlug === boss.slug ? "is-active" : ""}" data-boss-slug="${escapeHtml(boss.slug)}" type="button">
          ${escapeHtml(boss.shortName || boss.title)}
        </button>
      `
    )
    .join("");
}

export function renderDifficultyNav(activeDifficulty) {
  const options = [
    { id: 4, label: "英雄" },
    { id: 5, label: "史诗" }
  ];

  return options
    .map(
      (option) => `
        <button class="chip ${activeDifficulty === option.id ? "is-active" : ""}" data-difficulty="${option.id}" type="button">
          ${escapeHtml(option.label)}
        </button>
      `
    )
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
          </div>
          <h3>${escapeHtml(entry.guild?.name || "Unknown Guild")}</h3>
          <p>${escapeHtml(entry.server?.region || "")} ${escapeHtml(entry.server?.name || "")}</p>
          <ul class="compact-list">
            <li>时长：${Math.round((entry.duration || 0) / 1000)} 秒</li>
            <li>治疗：${entry.healers ?? "?"} / 坦克：${entry.tanks ?? "?"}</li>
            <li>死亡：${entry.deaths ?? "?"} / 团队人数：${entry.size ?? "?"}</li>
          </ul>
          <div class="boss-card__actions">
            <a
              class="link-button"
              href="./boss.html?boss=${encodeURIComponent(boss.slug)}&difficulty=${encodeURIComponent(boss.difficulty || 4)}&report=${encodeURIComponent(entry.reportCode)}&fight=${encodeURIComponent(entry.fightId)}"
            >
              查看时间轴
            </a>
            <a class="link-button link-button--subtle" href="https://www.warcraftlogs.com/reports/${encodeURIComponent(entry.reportCode)}#fight=${encodeURIComponent(entry.fightId)}" target="_blank" rel="noreferrer">打开 WCL</a>
          </div>
        </article>
      `
    )
    .join("");
}

export function renderTimelineDetail({ boss, rankings, timeline }) {
  const rankingMeta = rankings
    ? `
      <section class="card hero-card">
        <div class="badge-row">
          <span class="badge">${escapeHtml(boss.title)}</span>
          <span class="badge badge--ghost">排名 ${rankings.rank}</span>
        </div>
        <h2>${escapeHtml(timeline.bossName)}</h2>
        <p>公会：${escapeHtml(rankings.guild?.name || "Unknown Guild")} / 服务器：${escapeHtml(rankings.server?.region || "")} ${escapeHtml(rankings.server?.name || "")}</p>
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

  const rows = (timeline.timeline || [])
    .map(
      (entry) => `
        <tr>
          <td>${escapeHtml(entry.t)}</td>
          <td>${escapeHtml(entry.abilityName)}</td>
          <td>${escapeHtml(entry.type)}</td>
          <td>${escapeHtml(entry.sourceName || "")}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div class="detail-stack">
      ${rankingMeta}
      <section class="detail-section">
        <h2>时间轴</h2>
        <div class="timeline-table-wrap">
          <table class="timeline-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>技能</th>
                <th>事件类型</th>
                <th>来源</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

export function renderErrorState(message) {
  return `<section class="card error-state">${escapeHtml(message)}</section>`;
}
