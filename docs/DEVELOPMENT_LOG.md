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
  - `fetch-rankings.js`：按 Boss 查询高排名公开日志
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

## 下一步建议

- 继续完善 `timeline-filters.json`，提高各 Boss 的技能提取质量
- 扩展 `boss-mapping.json` 和 `docs/data/wcl/bosses.json`，覆盖更多 encounter
- 如果后续要做自动更新，可以把 `npm run wcl:boss -- "<boss>" 1 4` 放进 CI
