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
- `scripts/wcl/build-study.js`

## JSON 校验
```powershell
node scripts/validate-json.js
```

当前会校验：
- `docs/data/wcl/bosses.json`
- `docs/data/wcl/ui-config.json`
- `docs/data/wcl/rankings/*.json`
- `docs/data/wcl/timelines/*.json`
- `docs/data/wcl/studies/*.json`

## 手动联调建议
```powershell
npm run wcl:rankings -- "Imperator Averzian" 10 4 --class Priest --spec Holy --metric hps
npm run wcl:fetch -- 4C2f7rDHJwpBmRvK 4
npm run wcl:boss -- "Imperator Averzian" 2 4 --class Priest --spec Holy --metric hps
```
