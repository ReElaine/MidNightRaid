# Contributing Guide

本文档用于说明当前 `MidNightRaid` 仓库的日常维护方式。

## 工作目录

先进入仓库目录：

```powershell
cd MidNightRaid
```

## 日常流程

```powershell
git status
git add .
git commit -m "写一句本次修改内容"
git push
```

## WCL 相关检查

如果这次改动涉及 WCL 抓取脚本、JSON 结构或前端展示，建议至少跑下面几条：

```powershell
npm test
node scripts/validate-json.js
npm run wcl:rankings -- "Imperator Averzian" 1 4
```

如果你改了 timeline 生成逻辑，再补一条：

```powershell
npm run wcl:fetch -- 9nFBwKkAQHpcrWqh 1
```

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
git add scripts/wcl/build-timeline.js
git commit -m "Refine WCL timeline rendering"
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

- `scripts/wcl/` 下的抓取逻辑
- `docs/data/wcl/` 的 JSON 结构
- `docs/assets/js/` 的前端渲染逻辑

优先同步：

- `README.md`
- `TESTING.md`
- `docs/DEVELOPMENT_LOG.md`
