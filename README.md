# MidNightRaid

## 项目简介

MidNightRaid 现在是一个专注于 Warcraft Logs 的前端工具项目：

- `scripts/wcl/` 负责拉取 WCL V2 排名与 report 数据
- `docs/data/wcl/` 保存本地生成的 rankings / timelines JSON
- `docs/` 提供 GitHub Pages 可直接访问的静态前端

目标很直接：

- 查询指定 Boss 的高排名公开日志
- 生成本地时间轴 JSON
- 用静态页面快速浏览这些日志和关键技能轴

## 在线页面

- GitHub Pages 占位链接：[https://reelaine.github.io/MidNightRaid/](https://reelaine.github.io/MidNightRaid/)
- 首页入口：[`docs/index.html`](docs/index.html)

## 项目结构

- `docs/`：静态前端页面
- `docs/data/wcl/`：Boss 列表、rankings 和 timeline 数据
- `scripts/wcl/`：WCL V2 OAuth、GraphQL、排名抓取与时间轴生成脚本
- `tests/`：WCL 脚本单元测试
- `scripts/validate-json.js`：校验前端消费的 WCL JSON 结构

## 开发入口

- 接续开发前先看：[docs/DEVELOPMENT_LOG.md](docs/DEVELOPMENT_LOG.md)
- 日常维护说明：[CONTRIBUTING.md](CONTRIBUTING.md)
- 测试说明：[TESTING.md](TESTING.md)

## 环境准备

1. 复制 `.env.example` 为 `.env`
2. 填写：

```env
WCL_V2_CLIENT_ID=YOUR_WCL_V2_CLIENT_ID
WCL_V2_CLIENT_SECRET=YOUR_WCL_V2_CLIENT_SECRET
```

## 常用命令

查询某个 Boss 的高排名公开日志：

```powershell
npm run wcl:rankings -- "Imperator Averzian" 3 4
```

抓某个 report 的 fight 列表：

```powershell
npm run wcl:fights -- 9nFBwKkAQHpcrWqh
```

抓单条 fight 的时间轴：

```powershell
npm run wcl:fetch -- 9nFBwKkAQHpcrWqh 1
```

按 Boss 自动抓前几条高排名日志并生成时间轴：

```powershell
npm run wcl:boss -- "Imperator Averzian" 1 4
```

运行测试与校验：

```powershell
npm test
node scripts/validate-json.js
```

## 输出位置

排名 JSON：

```text
docs/data/wcl/rankings/<bossSlug>-d<difficulty>.json
```

时间轴 JSON：

```text
docs/data/wcl/timelines/<reportCode>-<fightId>.json
```

## 当前前端能力

- 首页读取本地 `bosses.json`
- 加载对应 Boss 的本地 rankings JSON
- 点击具体日志后进入时间轴详情页
- 详情页读取本地 timeline JSON 并展示技能时间轴

## 安全提醒

- `.env` 不会提交到 Git
- `client secret` 不应该出现在前端代码或公开页面中
- 如果 secret 泄露，建议去 WCL 后台立即轮换

## 开源许可

本仓库保留现有双许可证结构：

- 主许可证：`GPL-3.0-or-later`
- 内容与说明文本：`CC BY-SA 4.0`
- 代码：`GPL-3.0-or-later`

请同时阅读：

- [LICENSE](LICENSE)
- [LICENSE-CONTENT](LICENSE-CONTENT)
- [LICENSE-CODE](LICENSE-CODE)
- [LICENSE_GUIDE.md](LICENSE_GUIDE.md)
- [NOTICE.md](NOTICE.md)
