# Development Log

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
