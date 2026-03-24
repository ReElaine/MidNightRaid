# Contributing Guide

## 工作目录
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

## 当前主线
当前前端只启用神牧视角：
- 职业：`Priest`
- 专精：`Holy`
- 指标：`hps`
- 技能：`光晕`、`神圣化身`、`神圣赞美诗`

但扩展结构已经保留：
- `scripts/wcl/timeline-presets.json`
- `docs/data/wcl/ui-config.json`

后面要加回其他职业，优先补这两个配置，不要先重写前端。

## WCL 相关检查
如果这次改动涉及 `scripts/wcl/`、`docs/data/wcl/` 或前端 Boss 汇总展示，至少跑：

```powershell
npm test
node scripts/validate-json.js
npm run wcl:rankings -- "Imperator Averzian" 10 4 --class Priest --spec Holy --metric hps
npm run wcl:boss -- "Imperator Averzian" 2 4 --class Priest --spec Holy --metric hps
```

如果你改了时间轴生成逻辑，再补一条：

```powershell
npm run wcl:fetch -- 4C2f7rDHJwpBmRvK 4
```
