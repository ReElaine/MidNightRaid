# Testing Guide

本文档记录当前仓库的前端与数据层测试方式，方便后续在不引入重型构建工具的前提下持续回归。

## 当前测试方案

仓库目前使用：

- Node 自带测试框架 `node:test`
- 单文件 ESM 测试
- 不依赖 Jest / Vitest / Mocha

这样做的目的：

- 保持仓库轻量
- 不增加额外依赖安装步骤
- 适合当前原生 HTML / CSS / JavaScript 的静态站结构

## 测试目录

- `tests/`
- `tests/helpers/browser-env.mjs`

当前已覆盖的模块：

- `docs/assets/js/app.js`
- `docs/assets/js/router.js`
- `docs/assets/js/renderers.js`
- `docs/assets/js/data-loader.js`
- `docs/assets/js/wcl-auth.js`
- `docs/assets/js/wcl-api.js`
- `docs/assets/js/wcl-analysis.js`
- `docs/data/site-config.json`
- `docs/data/class-cooldowns.json`

## 运行方式

由于当前环境中 `node --test` 默认的文件隔离会触发子进程，而部分终端 / 沙箱环境可能限制 `spawn`，建议统一使用：

```powershell
node --test --test-concurrency=1 --test-isolation=none .\tests\*.test.mjs
```

同时继续保留现有 JSON 校验：

```powershell
node scripts/validate-json.js
```

## 推荐回归顺序

每次修改前端或数据配置后，建议至少执行：

```powershell
node --check .\docs\assets\js\app.js
node --check .\docs\assets\js\renderers.js
node --check .\docs\assets\js\wcl-auth.js
node --check .\docs\assets\js\wcl-api.js
node --check .\docs\assets\js\wcl-analysis.js
node --test --test-concurrency=1 --test-isolation=none .\tests\*.test.mjs
node scripts/validate-json.js
```

## 当前测试边界

当前测试主要覆盖：

- 路由参数读写
- WCL OAuth 本地状态逻辑
- WCL GraphQL 请求分页逻辑
- Boss / 职业时间轴归纳逻辑
- 渲染器输出的核心区块
- 站点配置和职业技能预设文件格式

当前还没有自动化覆盖的部分：

- 浏览器里真实的 OAuth 跳转联调
- 与真实 WCL 报告的端到端联调
- CSS 视觉回归

这些仍需要手工验证。
