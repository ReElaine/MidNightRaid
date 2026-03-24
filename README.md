# MidNightRaid

## 项目简介
MidNightRaid 现在是一个专注于 Warcraft Logs 的前端分析工具：

- `scripts/wcl/` 负责通过 WCL V2 GraphQL 拉取职业排名、日志和事件
- `docs/data/wcl/` 保存前端直接读取的本地 JSON
- `docs/` 提供可直接部署到 GitHub Pages 的静态页面

当前主线只保留两件事：

- 按职业 / 专精查询指定 Boss 的高排名公开日志
- 把多份日志汇总成 Boss 视角的对照页，观察同一波技能下不同玩家如何交技能

## 在线页面
- GitHub Pages 占位链接：[https://reelaine.github.io/MidNightRaid/](https://reelaine.github.io/MidNightRaid/)
- 本地入口：`docs/index.html`

## 项目结构
- `docs/`：静态前端页面
- `docs/data/wcl/`：Boss 列表与时间轴 JSON
- `scripts/wcl/`：WCL 认证、GraphQL 查询、职业排名抓取、时间轴生成
- `tests/`：WCL 脚本单元测试
- `scripts/validate-json.js`：校验前端消费的 JSON 结构

## 开发入口
- 开发接续日志：`docs/DEVELOPMENT_LOG.md`
- 维护说明：`CONTRIBUTING.md`
- 测试说明：`TESTING.md`

## 环境准备
1. 复制 `.env.example` 为 `.env`
2. 填写：

```env
WCL_V2_CLIENT_ID=YOUR_WCL_V2_CLIENT_ID
WCL_V2_CLIENT_SECRET=YOUR_WCL_V2_CLIENT_SECRET
```

## 常用命令
按职业 / 专精查询高排名日志：

```powershell
npm run wcl:rankings -- "Imperator Averzian" 10 4 --class Mage --spec Fire --metric dps
```

查看某个 report 的 fight 列表：

```powershell
npm run wcl:fights -- 9nFBwKkAQHpcrWqh
```

生成单条 fight 的时间轴：

```powershell
npm run wcl:fetch -- bq6CdBQDhMjcLtJv 43
```

按 Boss 自动抓前几条职业样本，并同时生成单 log 时间轴和 Boss 汇总页：

```powershell
npm run wcl:boss -- "Imperator Averzian" 3 4 --class Mage --spec Fire --metric dps
```

`wcl:study` 是同一个入口的别名：

```powershell
npm run wcl:study -- "Imperator Averzian" 3 4 --class Mage --spec Fire --metric dps
```

## 抓取策略配置
默认抓取行为由 `scripts/wcl/fetch-policy.json` 控制。

当前默认值：
- 排名模式：`character`
- 排名范围：前 `50`
- 默认难度：`4`
- 默认地区：`CN`
- `CN` 没结果时回退到全球公开日志
- 职业排名默认指标：`dps`
- `report / events` 默认 `translate: false`

## 时间轴预设
时间轴左右两侧使用 `scripts/wcl/timeline-presets.json`：

- Boss 关键技能白名单
- 各职业关键技能白名单

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
- 同一个 Boss 技能会汇总多份日志的样本
- 页面可以直接对比同一波 Boss 技能下，不同玩家交了哪些职业技能
- Boss 页支持以下筛选：
  - Boss 技能，多选
  - 样本玩家，多选
  - 职业技能，多选

## 测试与校验
```powershell
npm test
node scripts/validate-json.js
```

## 安全提醒
- `.env` 不会提交到 Git
- `client secret` 不应出现在前端代码或公开页面里
- 如果 secret 泄露，建议去 WCL 后台立即轮换

## 开源许可证
本仓库保留现有双许可证结构：

- 主许可证：`GPL-3.0-or-later`
- 内容与说明文本：`CC BY-SA 4.0`
- 代码：`GPL-3.0-or-later`
