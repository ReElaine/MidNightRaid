# Development Log

## 2026-03-25 / boss track source-aware filtering

- Boss timeline entries are no longer merged into one aggregated event per timestamp.
- `scripts/wcl/build-study.js` now writes boss-side entries per sample, keeping source information such as rank and player.
- On the frontend, filtering class abilities now also narrows the boss track to the same visible sample set.
- This makes the left lane and right lane comparable without forcing automatic mechanic matching.

## 2026-03-24 / H3 data and frontend registration

- Pulled fresh H3 Holy Priest top 10 HPS samples for `陨落之王萨哈达尔`.
- Added local `rankings`, `timelines`, and `study` JSON for H2 and H3.
- Marked frontend boss catalog so the index now only exposes bosses that already have study data wired in.
- Current enabled frontend bosses:
  - `H1 元首阿福扎恩`
  - `H2 弗拉希乌斯`
  - `H3 陨落之王萨哈达尔`

## 2026-03-24 / difficulty note

- Added a small documentation note that current WCL difficulty parameters map as:
  - `4` = Heroic
  - `5` = Mythic

## 2026-03-24 / segmented friendly cast fetching

- Fixed late-fight Holy Priest cooldowns being truncated from timeline data.
- Root cause: pulling all friendly casts for a long fight in one request could still cut off later events.
- `scripts/wcl/build-timeline.js` now fetches friendly cast events in multiple time windows and merges them back into one class timeline.
- After each window is fetched, only target class / spec player casts are kept.
- This change restored later casts such as repeated `神圣化身` and `神圣赞美诗` in long samples.

## 2026-03-24 / dual-track timeline refresh

- Boss study view no longer tries to match boss mechanics with priest cooldowns inside a response window.
- `scripts/wcl/build-study.js` now writes three direct study tracks:
  - `bossTrack`
  - `classTrack`
  - `timelineRows`
- `docs/assets/js/app.js` now filters rows directly instead of filtering matched response groups.
- `docs/assets/js/renderers.js` now renders a pure three-column timeline:
  - left: full boss timeline
  - middle: time
  - right: full class timeline
- Current study data was regenerated from top 10 Holy Priest HPS logs for Imperator Averzian.

## 2026-03-24 / current state

- 仓库已经清理为纯 WCL 工具项目
- 页面主视角已经从单条 log 切到 Boss 汇总
- 当前前端暂时只启用神牧视角：
  - `Priest / Holy / hps`
  - `光晕`
  - `神圣化身`
  - `神圣赞美诗`

## 当前目录职责

- `scripts/wcl/`
  - `fetch-rankings.js`：按 Boss 查询职业排名公开日志
  - `fetch-report.js`：读取 report fights、masterData、playerDetails
  - `fetch-events.js`：按 fight 拉事件
  - `build-timeline.js`：生成单条 timeline JSON
  - `build-study.js`：把多份 timeline 聚合成 Boss 汇总 JSON
  - `fetch-batch.js`：批量抓样本并生成 timeline + study
- `docs/data/wcl/`
  - `bosses.json`：Boss 列表
  - `ui-config.json`：前端可用职业 / 专精 / 指标配置
  - `rankings/`：职业排名结果
  - `timelines/`：单条日志时间轴
  - `studies/`：Boss 汇总结果

## 已验证

- `npm test`
- `node scripts/validate-json.js`
- `npm run wcl:boss -- "Imperator Averzian" 2 4 --class Priest --spec Holy --metric hps`

## 关键说明

- `timeline-presets.json` 当前只保留神牧技能，但 `classes` 结构还在
- `ui-config.json` 当前只开放神牧，但 `classProfiles` 结构还在
- 以后如果要恢复其他职业，优先补这两份配置
