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
