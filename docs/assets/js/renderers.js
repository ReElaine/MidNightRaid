function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

export function renderBossCards(bosses) {
  return bosses
    .map((boss) => {
      const action = boss.jsonPath
        ? `<a class="link-button" href="./boss.html?id=${encodeURIComponent(boss.id)}">查看攻略</a>`
        : `<span class="link-button link-button--subtle" aria-disabled="true">JSON 待补充</span>`;

      return `
        <article class="card boss-card">
          <div class="badge-row">
            <span class="badge">${escapeHtml(boss.raidTitle)}</span>
            <span class="badge badge--ghost">${escapeHtml(boss.difficulty)}</span>
            <span class="badge badge--ghost">${escapeHtml(boss.ptr ? "PTR" : "正式服")}</span>
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

export function renderBossDetail(boss, details) {
  if (!details) {
    return `
      <section class="card error-state">
        <h2>${escapeHtml(boss.title)}</h2>
        <p>当前 Boss 还没有对应的结构化 JSON 文件，暂时只能通过原始 Markdown 查看。</p>
        <p><a class="link-button" href="${escapeHtml(boss.sourceMarkdownUrl)}" target="_blank" rel="noreferrer">查看原始 Markdown</a></p>
      </section>
    `;
  }

  const roleTips = Object.entries(details.roleTips)
    .map(
      ([role, tips]) => `
        <article class="info-block">
          <h3>${escapeHtml(role.toUpperCase())}</h3>
          <ul>${tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
        </article>
      `
    )
    .join("");

  const phases = details.phases
    .map(
      (phase) => `
        <article class="phase-card">
          <h3>${escapeHtml(phase.name)}</h3>
          <p class="muted">${escapeHtml(phase.summary)}</p>
          <ul>${phase.keyPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
        </article>
      `
    )
    .join("");

  const abilities = details.abilities
    .map((ability) => {
      const media = ability.media
        ? `
          <figure class="ability-media">
            <img src="${escapeHtml(ability.media.path)}" alt="${escapeHtml(ability.media.alt || ability.name)}" loading="lazy">
            ${ability.media.caption ? `<figcaption>${escapeHtml(ability.media.caption)}</figcaption>` : ""}
          </figure>
        `
        : "";

      return `
        <article class="ability-card" id="ability-${escapeHtml(ability.id)}">
          <div class="badge-row">
            <span class="badge">${escapeHtml(ability.type)}</span>
            ${ability.importance ? `<span class="badge badge--ghost">${escapeHtml(ability.importance)}</span>` : ""}
          </div>
          <h3>${escapeHtml(ability.name)}</h3>
          <p>${escapeHtml(ability.description)}</p>
          <ul>${ability.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
          ${media}
        </article>
      `;
    })
    .join("");

  const timelineRows = details.timeline
    .map(
      (entry) => {
        const abilityCell = entry.abilityId
          ? `<a class="timeline-link" href="#ability-${escapeHtml(entry.abilityId)}">${escapeHtml(entry.ability)}</a>`
          : escapeHtml(entry.ability);

        return `
        <tr>
          <td>${escapeHtml(entry.time)}</td>
          <td>${abilityCell}</td>
          <td>${escapeHtml(entry.note)}</td>
        </tr>
      `;
      }
    )
    .join("");

  return `
    <div class="detail-stack">
      <section class="card hero-card">
        <div class="badge-row">
          <span class="badge">${escapeHtml(details.raidTitle)}</span>
          <span class="badge badge--ghost">${escapeHtml(details.difficulty)}</span>
          <span class="badge badge--ghost">${escapeHtml(details.ptr ? "PTR" : "正式服")}</span>
        </div>
        <h2>${escapeHtml(details.title)}</h2>
        <p>${escapeHtml(details.overview)}</p>
      </section>

      <section class="detail-section">
        <h2>职责提示</h2>
        <div class="role-grid">${roleTips}</div>
      </section>

      <section class="detail-section">
        <h2>阶段拆解</h2>
        <div class="phase-grid">${phases}</div>
      </section>

      <section class="detail-section">
        <h2>Boss 技能介绍</h2>
        <div class="ability-list">${abilities}</div>
      </section>

      <section class="detail-section">
        <h2>时间轴</h2>
        <div class="timeline-table-wrap">
          <table class="timeline-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>技能</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>${timelineRows}</tbody>
          </table>
        </div>
      </section>

      <section class="detail-section">
        <h2>原始 Markdown</h2>
        <p class="source-link">
          <a class="link-button link-button--subtle" href="${escapeHtml(details.sourceMarkdown.url)}" target="_blank" rel="noreferrer">
            ${escapeHtml(details.sourceMarkdown.label)}
          </a>
        </p>
      </section>
    </div>
  `;
}
