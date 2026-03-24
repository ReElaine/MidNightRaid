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
如果这次改动涉及 `scripts/wcl/`、`docs/data/wcl/` 或前端 Boss 汇总展示，至少跑：

```powershell
npm test
node scripts/validate-json.js
npm run wcl:rankings -- "Imperator Averzian" 10 4 --class Mage --spec Fire --metric dps
npm run wcl:boss -- "Imperator Averzian" 2 4 --class Mage --spec Fire --metric dps
```

如果你改了时间轴生成逻辑，再补一条：

```powershell
npm run wcl:fetch -- bq6CdBQDhMjcLtJv 43
```
## 重点配置
如果你在做职业抄作业链路，重点确认这两个配置文件：
- `scripts/wcl/fetch-policy.json`
- `scripts/wcl/timeline-presets.json`

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
git commit -m "Refine character timeline workflow"
git push
```

## 推送失败
仓库现在优先走 SSH。

```powershell
git status
git remote -v
ssh -T git@github.com
git push
```

## 文档同步
如果你修改了下面任意内容，请顺手更新文档：
- `scripts/wcl/` 里的抓取逻辑
- `docs/data/wcl/` 的 timeline / study JSON 结构
- `docs/assets/js/` 的前端筛选或 Boss 汇总渲染逻辑

优先同步：
- `README.md`
- `TESTING.md`
- `docs/DEVELOPMENT_LOG.md`
