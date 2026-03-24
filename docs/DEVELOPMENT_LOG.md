# Development Log

本文档用于帮助后续快速接手当前仓库。

---

## 2026-03-24 / current state

- 仓库已经清理为纯 WCL 工具项目
- 已删除：
  - 团队副本攻略 Markdown
  - 职业攻略
  - DPS 模拟内容
  - 旧的 Boss 详情 JSON、媒体资源和 Markdown 转换链路
- 保留并强化：
  - `scripts/wcl/`：WCL V2 OAuth、GraphQL、rankings、report 和 timeline 生成
  - `docs/data/wcl/`：前端直接消费的本地 JSON
  - `docs/`：纯静态前端

---

## 当前目录职责

- `scripts/wcl/`
  - `fetch-rankings.js`：按 Boss 查询高排名公开日志，支持 `fight` / `character` 双模式
  - `fetch-report.js`：读取 report 中的 fights 和 masterData
  - `fetch-events.js`：按 fight 拉取事件流
  - `build-timeline.js`：过滤关键事件并生成 timeline JSON
  - `fetch-batch.js`：按 Boss 自动抓取前几条公开日志并批量生成时间轴
- `docs/data/wcl/`
  - `bosses.json`：前端支持的 Boss 列表
  - `rankings/`：排名结果
  - `timelines/`：时间轴结果
- `docs/assets/js/`
  - 现在只负责读取本地 WCL JSON 并渲染页面

---

## 已验证

- WCL V2 client credentials 可用
- `Encounter.fightRankings` 可返回公开日志
- 本地已经成功生成：
  - `docs/data/wcl/rankings/spire_h1_afuzan-d4.json`
  - `docs/data/wcl/timelines/9nFBwKkAQHpcrWqh-1.json`
- 已通过：
  - `npm test`
  - `node scripts/validate-json.js`

---

## 2026-03-24 / fetch policy

- 新增 `scripts/wcl/fetch-policy.json`
- 抓取策略已配置化：
  - 默认排名模式 `fight`
  - 默认排名范围前 `50`
  - 默认优先 `CN`
  - 若 `CN` 没有结果，允许回退到全球公开日志
  - report / events 默认关闭 `translate`
- 这意味着后续如果你想优先抓中文区或切换到全球，不需要改核心脚本，只要改配置文件

---

## 2026-03-24 / character rankings

- 已确认 `Encounter.characterRankings` 可用于按职业/专精表现查公开日志
- 当前脚本已支持：
  - `--mode character`
  - `--class <ClassName>`
  - `--spec <SpecName>`
  - `--metric <Metric>`
- 输出文件会和整团排名分开命名，例如：
  - `docs/data/wcl/rankings/spire_h1_afuzan-d4-mage-fire-dps.json`
- 这个模式适合做“按职业抄作业”，然后继续复用现有时间轴抓取链路

---

## 下一步建议

- 继续完善 `timeline-filters.json`，提高各 Boss 的技能提取质量
- 扩展 `boss-mapping.json` 和 `docs/data/wcl/bosses.json`，覆盖更多 encounter
- 如果后续要做自动更新，可以把 `npm run wcl:boss -- "<boss>" 1 4` 放进 CI
