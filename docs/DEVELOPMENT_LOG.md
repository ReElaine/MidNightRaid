# Development Log

这份文档用来帮助后续快速接手当前仓库。

---

## 2026-03-24 / current state

- 仓库已经清理为纯 WCL 工具项目
- 已删除旧的团本攻略、职业攻略、DPS 模拟和旧内容层
- 当前主线只保留：
  - `scripts/wcl/`：WCL V2 OAuth、GraphQL、排名抓取、时间轴生成
  - `docs/data/wcl/`：前端直接消费的本地 JSON
  - `docs/`：纯静态前端页面

---

## 当前目录职责

- `scripts/wcl/`
  - `fetch-rankings.js`：按 Boss 查询公开高排名日志，支持 `fight` 和 `character` 双模式
  - `fetch-report.js`：读取 report fights、masterData、playerDetails
  - `fetch-events.js`：按 fight 拉事件
  - `build-timeline.js`：生成双轨时间轴 JSON
  - `fetch-batch.js`：按 Boss 批量抓前几条日志并生成时间轴
- `docs/data/wcl/`
  - `bosses.json`：前端支持的 Boss 列表
  - `rankings/`：排名结果
  - `timelines/`：时间轴结果
- `docs/assets/js/`
  - 只负责读取本地 WCL JSON 并渲染页面

---

## 已验证

- WCL V2 client credentials 可用
- `Encounter.fightRankings` 可用于整团日志发现
- `Encounter.characterRankings` 可用于按职业 / 专精表现发现日志
- 已通过：
  - `npm test`
  - `node scripts/validate-json.js`
  - `npm run wcl:fetch -- bq6CdBQDhMjcLtJv 43`
  - `npm run wcl:rankings -- "Imperator Averzian" 10 4 --mode character --class Mage --spec Fire`

---

## 2026-03-24 / fetch policy

- 新增并持续使用 [`C:\Working\MidNightRaid\scripts\wcl\fetch-policy.json`](C:\Working\MidNightRaid\scripts\wcl\fetch-policy.json)
- 当前策略：
  - 默认模式 `fight`
  - 默认前 `50`
  - 默认地区 `CN`
  - `CN` 无结果时回退到全球
  - report / events 默认关闭 `translate`

这意味着后续如果想切地区、抓取范围或默认职业模式，优先改配置，不要先改脚本。

---

## 2026-03-24 / character rankings

- 已接入 `character` 模式
- 当前支持参数：
  - `--class`
  - `--spec`
  - `--metric`
- 输出文件会按职业模式单独命名，例如：
  - `docs/data/wcl/rankings/spire_h1_afuzan-d4-mage-fire-dps.json`
  - `docs/data/wcl/rankings/spire_h1_afuzan-d4-mage-fire-dps-sunfury.json`

## 2026-03-24 / dual-lane timeline UI

- 时间轴 JSON 现在包含：
  - `timeline`
  - `bossTimeline`
  - `classTimeline`
  - `filters`
  - `presetId`
  - `presetName`
  - `preset`
- 详情页现在是双轨布局：
  - 左侧 Boss 关键技能
  - 右侧职业关键技能
  - 中间共用时间刻度
- 前端筛选支持：
  - Boss 技能，多选
  - 职业
  - 专精
  - 职业技能，多选

---

## 当前最值得继续做的事

- 针对常用职业把 `class abilities` 进一步细化到专精层
- 扩展 `bosses.json` 和 `boss-mapping.json`，覆盖更多 encounter
- 如果准备自动更新，可以把 `npm run wcl:boss -- "<boss>" 1 4` 放进 CI
