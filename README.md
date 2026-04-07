# MidNightRaid

## 项目简介

MidNightRaid 现在是一个专注于 Warcraft Logs 的前端分析工具：

- `scripts/wcl/` 负责通过 WCL V2 GraphQL 拉取职业排名、日志和事件
- `docs/data/wcl/` 保存前端直接读取的本地 JSON
- `docs/` 提供可直接部署到 GitHub Pages 的静态页面

当前主线聚焦在 Boss 汇总视角：

- 按职业 / 专精查询指定 Boss 的高排名公开日志
- 把多份日志汇总成同一个 Boss 的双轨时间轴页面
- 左侧完整展示 Boss 技能，右侧完整展示目标职业技能

当前前端已启用以下职业视角：

- `Priest / Holy / hps`
- `DemonHunter / Havoc / dps`

当前神牧展示技能：

- `光晕`
- `神圣化身`
- `神圣赞美诗`

当前噬灭恶魔猎手展示技能：

- `眼棱`
- `恶魔变形`
- `献祭光环`
- `恶魔追击`

同时，前端和数据层已经预留了扩展结构，后续加回其他职业时不需要重做架构。

当前已经接入前端的 Boss：

- `H1 元首阿福扎恩`
- `H2 弗拉希乌斯`
- `H3 陨落之王萨哈达尔`

## 最新抓取说明

- 友方技能不再按整场一次性抓取，而是按时间窗口分段抓取 `Friendlies + Casts`
- 每个时间窗口抓回来后，只保留目标职业 / 专精玩家的施法事件，再合并回整场时间轴
- 这样可以避免长战斗里前半段事件过多，把后半段的 `神圣化身`、`神圣赞美诗` 这类大技能截掉

## Difficulty 编号

- `4` = 英雄
- `5` = 史诗

## 在线页面

- GitHub Pages: [https://reelaine.github.io/MidNightRaid/](https://reelaine.github.io/MidNightRaid/)
- 本地入口：`docs/index.html`

## 项目结构

- `docs/`：静态前端页面
- `docs/data/wcl/`：Boss 列表、study JSON、timeline JSON、UI 配置
- `scripts/wcl/`：WCL 认证、GraphQL 查询、职业排名抓取、时间轴生成、Boss 汇总
- `tests/`：WCL 脚本单元测试
- `scripts/validate-json.js`：校验前端消费的 JSON 结构

## 环境准备

1. 复制 `.env.example` 为 `.env`
2. 填写：

```env
WCL_V2_CLIENT_ID=YOUR_WCL_V2_CLIENT_ID
WCL_V2_CLIENT_SECRET=YOUR_WCL_V2_CLIENT_SECRET
```

## 常用命令

按神牧查询高排名日志：

```powershell
npm run wcl:rankings -- "Imperator Averzian" 10 4 --class Priest --spec Holy --metric hps
```

查看某个 report 的 fight 列表：

```powershell
npm run wcl:fights -- 4C2f7rDHJwpBmRvK
```

生成单条 fight 的时间轴：

```powershell
npm run wcl:fetch -- 4C2f7rDHJwpBmRvK 4
```

按 Boss 自动抓前几条神牧样本，并同时生成单 log 时间轴和 Boss 汇总页：

```powershell
npm run wcl:boss -- "Imperator Averzian" 2 4 --class Priest --spec Holy --metric hps
```

`wcl:study` 是同一个入口的别名：

```powershell
npm run wcl:study -- "Imperator Averzian" 2 4 --class Priest --spec Holy --metric hps
```

## 抓取策略配置

默认抓取行为由 `scripts/wcl/fetch-policy.json` 控制。

当前默认值：

- 排名模式：`character`
- 排名范围：前 `50`
- 默认难度：`4`
- 默认地区：`CN`
- 默认职业：`Priest`
- 默认专精：`Holy`
- 默认指标：`hps`
- `CN` 没结果时回退到全球公开日志
- `report / events` 默认 `translate: false`
- 友方职业技能按时间窗口分段抓取：
  - `friendlyWindowMs`
  - `friendlySliceLimit`

## 时间轴与 UI 预设

- `scripts/wcl/timeline-presets.json`
  当前只启用神牧技能白名单，但保留 `classes` 结构，方便后续加回其他职业
- `docs/data/wcl/ui-config.json`
  前端可选职业 / 专精 / 指标配置，当前开放 `Priest / Holy / hps` 与 `DemonHunter / Havoc / dps`

## 输出位置

职业排名 JSON：

```text
docs/data/wcl/rankings/<bossSlug>-d<difficulty>-<class>-<spec>-<metric>.json
```

时间轴 JSON：

```text
docs/data/wcl/timelines/<reportCode>-<fightId>.json
```

Boss 汇总 JSON：

```text
docs/data/wcl/studies/<bossSlug>-d<difficulty>-<class>-<spec>-<metric>.json
```

## 当前前端能力

- 首页按 Boss 展示汇总入口
- Boss 页读取本地 `study` JSON
- 同一个 Boss 技能会汇总多份日志样本
- 页面可以直接对比同一波 Boss 技能下，不同神牧交了哪些技能
- Boss 页支持以下筛选：
  - Boss 技能，多选
  - 样本玩家，多选
  - 神牧技能，多选

## 测试与校验

```powershell
npm test
node scripts/validate-json.js
```
