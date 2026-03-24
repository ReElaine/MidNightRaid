# Testing

## 单元测试
```powershell
npm test
```

当前覆盖：

- `scripts/wcl/utils.js`
- `scripts/wcl/hero-talents.js`
- `scripts/wcl/fetch-rankings.js`
- `scripts/wcl/fetch-report.js`
- `scripts/wcl/build-timeline.js`

说明：

- `npm test` 目前固定为单进程模式，避免 Windows 环境下的 `spawn EPERM`

## JSON 校验
```powershell
node scripts/validate-json.js
```

当前会校验：

- `docs/data/wcl/bosses.json`
- `docs/data/wcl/rankings/*.json`
- `docs/data/wcl/timelines/*.json`

## 手动联调建议
改完抓取策略或 WCL GraphQL 查询后，建议至少跑：

```powershell
npm run wcl:rankings -- "Imperator Averzian"
npm run wcl:rankings -- "Imperator Averzian" 10 4 --mode character --class Mage --spec Fire --metric dps
npm run wcl:fetch -- bq6CdBQDhMjcLtJv 43
```

如果你改了职业筛选、专精筛选或职业技能筛选，再补：

```powershell
npm run wcl:boss -- "Imperator Averzian" 1 4 --mode character --class Mage --spec Fire --metric dps
```

## 预设与识别规则
这两份配置直接影响测试结果：

- [`C:\Working\MidNightRaid\scripts\wcl\fetch-policy.json`](C:\Working\MidNightRaid\scripts\wcl\fetch-policy.json)
- [`C:\Working\MidNightRaid\scripts\wcl\timeline-presets.json`](C:\Working\MidNightRaid\scripts\wcl\timeline-presets.json)

如果你加了新的职业预设或技能筛选规则，记得同时补：

- 单元测试
- 至少一条真实日志联调
