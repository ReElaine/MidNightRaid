# MidNightRaid

## 项目简介
MidNightRaid 现在是一个专注于 Warcraft Logs 的前端分析工具：

- `scripts/wcl/` 负责通过 WCL V2 GraphQL 拉取排名、日志和事件
- `docs/data/wcl/` 保存前端直接读取的本地 `rankings` 和 `timelines` JSON
- `docs/` 提供可直接部署到 GitHub Pages 的静态页面

目标很直接：

- 查询指定 Boss 的高排名公开日志
- 生成本地时间轴 JSON
- 用静态页面同时查看 Boss 主轴和职业技能轴

## 在线页面
- GitHub Pages 占位链接：[https://reelaine.github.io/MidNightRaid/](https://reelaine.github.io/MidNightRaid/)
- 首页入口：[`C:\Working\MidNightRaid\docs\index.html`](C:\Working\MidNightRaid\docs\index.html)

## 项目结构
- `docs/`：静态前端页面
- `docs/data/wcl/`：Boss 列表、排名结果、时间轴结果
- `scripts/wcl/`：WCL 认证、GraphQL 查询、排名抓取、时间轴生成
- `tests/`：WCL 脚本单元测试
- `scripts/validate-json.js`：校验前端消费的 JSON 结构

## 开发入口
- 开发接续日志：[`C:\Working\MidNightRaid\docs\DEVELOPMENT_LOG.md`](C:\Working\MidNightRaid\docs\DEVELOPMENT_LOG.md)
- 维护说明：[`C:\Working\MidNightRaid\CONTRIBUTING.md`](C:\Working\MidNightRaid\CONTRIBUTING.md)
- 测试说明：[`C:\Working\MidNightRaid\TESTING.md`](C:\Working\MidNightRaid\TESTING.md)

## 环境准备
1. 复制 `.env.example` 为 `.env`
2. 填写：

```env
WCL_V2_CLIENT_ID=YOUR_WCL_V2_CLIENT_ID
WCL_V2_CLIENT_SECRET=YOUR_WCL_V2_CLIENT_SECRET
```

## 常用命令
查询某个 Boss 的公开高排名日志：

```powershell
npm run wcl:rankings -- "Imperator Averzian"
```

按职业 / 专精查询高排名日志：

```powershell
npm run wcl:rankings -- "Imperator Averzian" 10 4 --mode character --class Mage --spec Fire --metric dps
```

按职业 / 专精 / 英雄天赋进一步筛选：

```powershell
npm run wcl:rankings -- "Imperator Averzian" 10 4 --mode character --class Mage --spec Fire --heroTalent Sunfury --metric dps
```

查看某个 report 的 fight 列表：

```powershell
npm run wcl:fights -- 9nFBwKkAQHpcrWqh
```

生成单条 fight 的时间轴：

```powershell
npm run wcl:fetch -- bq6CdBQDhMjcLtJv 43
```

按 Boss 自动抓前几条高排名日志并生成时间轴：

```powershell
npm run wcl:boss -- "Imperator Averzian" 1 4
```

按职业 / 专精 / 英雄天赋自动抓前几条高排名日志并生成时间轴：

```powershell
npm run wcl:boss -- "Imperator Averzian" 3 4 --mode character --class Mage --spec Fire --heroTalent Sunfury --metric dps
```

## 抓取策略配置
默认抓取行为由 [`C:\Working\MidNightRaid\scripts\wcl\fetch-policy.json`](C:\Working\MidNightRaid\scripts\wcl\fetch-policy.json) 控制。

当前默认值：

- 排名模式：`fight`
- 排名范围：前 `50`
- 默认难度：`4`
- 默认地区：`CN`
- `CN` 没结果时允许回退到全球公开日志
- 职业排名默认指标：`dps`
- `report / events` 默认 `translate: false`

如果你想调整地区、抓取数量、职业模式默认项，优先改这个文件。

## 时间轴预设配置
时间轴右侧的职业轴使用 [`C:\Working\MidNightRaid\scripts\wcl\timeline-presets.json`](C:\Working\MidNightRaid\scripts\wcl\timeline-presets.json)。

这里现在负责三类内容：

- Boss 关键技能白名单
- 各职业关键技能白名单
- 英雄天赋识别与覆盖

当前支持的英雄天赋配置方式：

- `overridesByPlayer`：直接给某个角色名指定英雄天赋
- `overridesByClassSpec`：给某个 `职业:专精` 直接指定英雄天赋
- `detectByClassSpec`：按 `talentTree` 的 `id / nodeID` 规则识别英雄天赋

示例结构：

```json
{
  "heroTalent": {
    "overridesByPlayer": {
      "测试法师": "日怒"
    },
    "overridesByClassSpec": {
      "Mage:Frost": "霜火"
    },
    "detectByClassSpec": {
      "Mage:Arcane": [
        { "label": "日怒", "talentIdsAny": [777001] },
        { "label": "咒咏", "nodeIdsAny": [888002] }
      ]
    }
  }
}
```

## 输出位置
整团排名 JSON：

```text
docs/data/wcl/rankings/<bossSlug>-d<difficulty>.json
```

职业排名 JSON：

```text
docs/data/wcl/rankings/<bossSlug>-d<difficulty>-<class>-<spec>-<metric>[-<heroTalent>].json
```

时间轴 JSON：

```text
docs/data/wcl/timelines/<reportCode>-<fightId>.json
```

## 当前前端能力
- 首页读取本地 `bosses.json`
- 加载对应 Boss 的本地 `rankings` JSON
- 详情页读取本地 `timeline` JSON
- 时间轴使用同一条纵向时间刻度：
  - 左侧显示 Boss 关键技能
  - 右侧显示职业关键技能
- 详情页支持按以下维度逐层筛选：
  - Boss 技能
  - 职业
  - 专精
  - 英雄天赋
  - 职业技能

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

请同时阅读：

- [`C:\Working\MidNightRaid\LICENSE`](C:\Working\MidNightRaid\LICENSE)
- [`C:\Working\MidNightRaid\LICENSE-CONTENT`](C:\Working\MidNightRaid\LICENSE-CONTENT)
- [`C:\Working\MidNightRaid\LICENSE-CODE`](C:\Working\MidNightRaid\LICENSE-CODE)
- [`C:\Working\MidNightRaid\LICENSE_GUIDE.md`](C:\Working\MidNightRaid\LICENSE_GUIDE.md)
- [`C:\Working\MidNightRaid\NOTICE.md`](C:\Working\MidNightRaid\NOTICE.md)
