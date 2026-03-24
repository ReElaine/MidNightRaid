# Contributing Guide

## 工作目录
先进入仓库目录：

```powershell
cd C:\Working\MidNightRaid
```

## 日常流程
```powershell
git status
git add .
git commit -m "写一句这次修改内容"
git push
```

## WCL 相关检查
如果这次改动涉及 `scripts/wcl/`、`docs/data/wcl/` 或前端时间轴展示，至少跑：

```powershell
npm test
node scripts/validate-json.js
npm run wcl:rankings -- "Imperator Averzian" 1 4
npm run wcl:rankings -- "Imperator Averzian" 10 4 --mode character --class Mage --spec Fire --metric dps
```

如果你改了时间轴生成逻辑，再补一条：

```powershell
npm run wcl:fetch -- bq6CdBQDhMjcLtJv 43
```

如果你改了职业筛选、专精筛选或职业技能过滤，再补一条：

```powershell
npm run wcl:rankings -- "Imperator Averzian" 10 4 --mode character --class Mage --spec Fire --metric dps
```

## 重点配置
如果你在做职业抄作业链路，重点确认这两个配置文件：

- [`C:\Working\MidNightRaid\scripts\wcl\fetch-policy.json`](C:\Working\MidNightRaid\scripts\wcl\fetch-policy.json)
- [`C:\Working\MidNightRaid\scripts\wcl\timeline-presets.json`](C:\Working\MidNightRaid\scripts\wcl\timeline-presets.json)

尤其要看：

- `rankings.defaultMode`
- `rankings.character.className`
- `rankings.character.specName`
- `rankings.character.metric`

## 常用命令
```powershell
git status
git diff
git log --oneline -5
```

## 只提交部分文件
```powershell
git add README.md
git add docs/assets/js/app.js
git add docs/assets/js/renderers.js
git add scripts/wcl/build-timeline.js
git add scripts/wcl/fetch-rankings.js
git commit -m "Refine class/spec/hero-talent filters"
git push
```

## 推送失败
```powershell
git status
git remote -v
git pull --rebase
git push
```

## 文档同步
如果你修改了下面任意内容，请顺手更新文档：

- `scripts/wcl/` 里的抓取逻辑
- `docs/data/wcl/` 的 JSON 结构
- `docs/assets/js/` 的前端筛选或渲染逻辑

优先同步：

- [`C:\Working\MidNightRaid\README.md`](C:\Working\MidNightRaid\README.md)
- [`C:\Working\MidNightRaid\TESTING.md`](C:\Working\MidNightRaid\TESTING.md)
- [`C:\Working\MidNightRaid\docs\DEVELOPMENT_LOG.md`](C:\Working\MidNightRaid\docs\DEVELOPMENT_LOG.md)
