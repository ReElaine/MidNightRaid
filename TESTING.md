# Testing

## 单元测试

```powershell
npm test
```

当前覆盖：

- `scripts/wcl/utils.js`
- `scripts/wcl/fetch-rankings.js`
- `scripts/wcl/fetch-report.js`
- `scripts/wcl/build-timeline.js`

说明：

- `npm test` 已固定为单进程模式，避免当前 Windows 环境下默认子进程测试触发 `spawn EPERM`

## JSON 校验

```powershell
node scripts/validate-json.js
```

当前会校验：

- `docs/data/wcl/bosses.json`
- `docs/data/wcl/rankings/*.json`
- `docs/data/wcl/timelines/*.json`

## 抓取策略

当前默认抓取策略放在：

- `scripts/wcl/fetch-policy.json`

建议改完后至少手动验证一次：

```powershell
npm run wcl:rankings -- "Imperator Averzian"
npm run wcl:rankings -- "Imperator Averzian" 10 4 --mode character --class Mage --spec Fire --metric dps
npm run wcl:boss -- "Imperator Averzian" 1 4 --mode character --class Mage --spec Fire --metric dps
```
