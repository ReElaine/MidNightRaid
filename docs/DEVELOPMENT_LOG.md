# Development Log

本文档用于记录仓库每一轮关键结构变化、内容迁移、数据模型更新与后续开发入口。

目标：

- 拉取远程最新状态后，优先阅读此文档即可快速恢复上下文
- 不必反复从提交历史和目录结构中重新推断当前状态
- 作为后续持续追加的开发接续日志

---

## 2026-03-23 / working tree

- 同步方式：在本地工作树中继续前端改造
- 当前主题：把站点从“静态攻略展示”改造成“WCL 抄作业工具”
- 当前已落地的结构变化：
  - 新增 WCL 站点配置文件 `docs/data/site-config.json`
  - 新增职业关键技能预设 `docs/data/class-cooldowns.json`
  - 新增前端模块：
    - `docs/assets/js/wcl-auth.js`
    - `docs/assets/js/wcl-api.js`
    - `docs/assets/js/wcl-analysis.js`
  - `data-loader.js` 已扩展，可读取站点配置和职业技能预设
  - `router.js` 已扩展，支持 `report` / `fight` 查询参数
  - `app.js`、`index.html`、`boss.html`、`renderers.js`、`style.css` 已转向 WCL 分析工作流
- 当前目标数据流：
  1. 前端通过 OAuth PKCE 连接 WCL
  2. 读取报告元数据与 fights
  3. 拉取指定 fight 的 Cast 事件
  4. 用 Boss 结构化 JSON 与职业预设过滤关键技能
  5. 渲染 Boss 技能轴、团队关键技能总表、按职业拆分时间轴
- 当前测试覆盖：
  - 已新增 `tests/` 目录
  - 已为以下模块补充原生单元测试：
    - `app.js`
    - `router.js`
    - `renderers.js`
    - `data-loader.js`
    - `wcl-auth.js`
    - `wcl-api.js`
    - `wcl-analysis.js`
    - `site-config.json`
    - `class-cooldowns.json`
  - 当前推荐测试命令：
    - `node --test --test-concurrency=1 --test-isolation=none .\tests\*.test.mjs`
    - `node scripts/validate-json.js`
- 当前注意事项：
  - 这一轮仍是“前端主链路改造中”，需要在真实 WCL 授权环境下补一次联调
  - Boss 关键技能预设当前优先从结构化 Boss JSON 的 `abilities` 衍生，后续可按需要增加更细的别名或覆盖规则
  - 职业关键技能表现在是第一版可维护配置，后续可继续扩展

---

## 2026-03-18 / d00bcad

- 同步方式：本地直接开发后提交
- 关键提交：`d00bcad docs: add dream rift boss json data`
- 主要结构变化：
  - 梦境裂隙的 `H 奇美鲁斯，未梦之神` 与 `M 奇美鲁斯，未梦之神` 已正式接入 JSON 数据层
  - `docs/data/raids.json` 中，`dream_rift_h_chimerus` 与 `dream_rift_m_chimerus` 已从 `jsonPath: null` 改为前端可直接加载的详情 JSON
  - 英雄难度版本已整理为相对完整的结构化攻略，史诗难度版本当前以“相对英雄的差异点”形式接入
- 新增脚本或资源：
  - 新增 `docs/data/bosses/dream_rift/dream_rift_h_chimerus.json`
  - 新增 `docs/data/bosses/dream_rift/dream_rift_m_chimerus.json`
  - 新增 `docs/assets/media/dream_rift/` 下的一组图片和 GIF，供 GitHub Pages 直接访问
  - `scripts/md-to-boss-json.js` 已增强：
    - 支持解析正文里的 `Tank：` / `Healer：` / `DPS：` 行内写法
    - 遇到 `../../assets/...` 素材时，会自动复制到 `docs/assets/media/<raidId>/`
- 当前下一步：
  - 优先继续把 `虚影尖塔` 其余 Boss 按同样方式转成 JSON
  - 补全梦境裂隙的精确时间轴后，可再次运行转换脚本刷新 `timeline`
  - 若后续新增攻略仍沿用旧素材路径，直接走 Markdown -> JSON 转换即可，不必手工搬图

### 本轮额外环境修复

- 已修复当前机器上的 Git HTTPS 连接问题
- 原因：
  - Windows `schannel` TLS 后端在本机环境下会报 `SEC_E_NO_CREDENTIALS`
  - `git credential-manager diagnose` 中也能复现 HTTPS 握手失败
- 处理：
  - 已把全局 Git 配置从 `http.sslbackend=schannel` 切换为 `http.sslbackend=openssl`
- 验证结果：
  - `git ls-remote origin refs/heads/main` 成功
  - `git fetch origin` 成功
- 影响：
  - 后续 `git fetch` / `git pull` / `git push` 默认走 OpenSSL，不再依赖当前有问题的 Windows TLS 凭据栈
  - 如果未来换新环境，优先检查 `git config --global http.sslbackend`

---

## 当前同步状态

- 记录日期：2026-03-18
- 本地同步方式：`git pull --ff-only`
- 当前 HEAD：`706469f`
- 当前分支：`main`

最近同步到的提交区间：

- `1e12e3d` feat: add new boss guide schema and H2 data
- `1a4acc0` fix: normalize boss detail schemas
- `618a9cd` docs: expand H1 and H2 boss guide assets
- `9470686` docs: switch content workflow to markdown-first
- `11ba775` refactor: remove ptr from docs data model
- `706469f` style: stack homepage filters above boss list

---

## 当前项目结构结论

### 1. 内容源以 Markdown 为主

当前仓库已经明确切换到：

- `content/` 是人工维护的主入口
- `docs/data/` 是站点消费的数据层
- 推荐通过脚本从 Markdown 生成 Boss JSON，而不是手改 JSON 为主

核心文档：

- [CONTENT_WORKFLOW.md](CONTENT_WORKFLOW.md)

### 2. 文件命名已去掉 PTR 后缀

这次同步后，多数 Boss 文件从：

- `H1-元首阿福扎恩(PTR).md`

改成了：

- `H1-元首阿福扎恩.md`

同样地，JSON 文件也从：

- `spire_h1_afuzan_ptr.json`

切换为：

- `spire_h1_afuzan.json`

这意味着后续新增和转换时，默认不再把 `PTR` 当作程序层字段或文件命名的一部分。

### 3. docs 数据模型已经升级

当前 `docs/data/raids.json` 里的 Boss 元数据字段，以这组为主：

- `id`
- `title`
- `difficulty`
- `summary`
- `raidId`
- `contentPath`
- `jsonPath`
- `sourceMarkdownUrl`
- `tags`

注意：

- `ptr` 字段已从 docs 数据模型中移除
- 站点筛选和展示应基于 `difficulty`、`raidId`、`tags` 等字段

### 4. H1 与 H2 已有完整 JSON 数据

当前完整接入新结构化 JSON 的 Boss：

- `docs/data/bosses/void_spire/spire_h1_afuzan.json`
- `docs/data/bosses/void_spire/spire_h2_fulasius.json`

未完成 JSON 的 Boss 仍然保留在 `content/` 中，等待后续转换。

---

## 本轮远程修改摘要

### `1e12e3d` 新增 H2 完整数据与新 Boss Schema

这一轮的重点是：

- 为 `H2 弗拉希乌斯` 增加完整 JSON 数据
- 引入新的 Boss 详情结构

结合当前文件结果，可以推断新 schema 已围绕以下区块组织：

- `summary`
- `quickStart`
- `roles`
- `abilities`
- `timeline`
- `sources`

这比之前更偏“攻略站模板”，也更适合从 Markdown 自动转换。

### `1a4acc0` 统一 Boss 详情 Schema

这一步是承接上一轮的结构整理：

- 统一 H1 / H2 的数据字段
- 清理旧字段命名与临时兼容结构
- 让 `data-loader.js` 与 `renderers.js` 按统一结构消费数据

后续新增 Boss 时，应该优先参考：

- `spire_h1_afuzan.json`
- `spire_h2_fulasius.json`

不要再参考早期带 `ptr` 的旧 JSON 模板。

### `618a9cd` 扩充 H1 / H2 站点媒体资源

这轮新增了大量站点侧资源，位置在：

- `docs/assets/media/void_spire/`

新增资源覆盖了：

- H1 元首阿福扎恩的暗影进军、黑暗颠覆、暗影方阵、虚空之喉、污染优先级等图/GIF
- H2 弗拉希乌斯的寄生虫刷新、定身、爆炸、吐息、砸地、压制脉冲、晶墙等图/GIF

这说明当前推荐做法已经变成：

- 页面展示资源优先放在 `docs/assets/media/...`
- 不再依赖根目录 `assets/` 直接作为站点消费路径

### `9470686` 内容维护流程转向 Markdown First

这是一个很关键的流程变化：

- 人工维护入口是 `content/` 的 Markdown
- JSON 通过 `scripts/md-to-boss-json.js` 生成
- 校验仍通过 `scripts/validate-json.js`

这意味着以后开发的优先顺序应该是：

1. 先改 Boss Markdown
2. 再运行转换脚本
3. 再运行校验脚本
4. 最后检查页面渲染

### `11ba775` 去掉 PTR 数据字段

这一轮对站点逻辑影响很大：

- docs 侧不再把 `ptr` 作为常驻字段
- 页面展示和筛选逻辑应该逐步围绕“难度 / 副本 / 标签”组织
- 文案如果仍需保留 PTR 信息，应由内容文本本身表达，而不是结构字段主导

### `706469f` 首页筛选布局上移

这一步主要是前端布局调整：

- 首页筛选区现在堆叠在 Boss 列表上方
- 说明页面已经朝更明显的“内容筛选器 + 列表结果”模式收敛

后续新增筛选器、标签或排序时，优先沿用这个布局，而不要回到早期分散式结构。

---

## 当前推荐开发流程

### 修改单个 Boss 内容

1. 编辑 `content/` 中对应 Boss Markdown
2. 运行转换脚本生成 JSON
3. 运行校验脚本
4. 本地检查页面效果

推荐命令：

```powershell
cd MidNightRaid
node scripts/md-to-boss-json.js "content/虚影尖塔/H1-元首阿福扎恩.md"
node scripts/md-to-boss-json.js "content/虚影尖塔/H2-弗拉希乌斯.md"
node scripts/validate-json.js
git diff
```

### 拉取远程最新状态后恢复工作

建议顺序：

```powershell
git pull --ff-only
Get-Content docs\DEVELOPMENT_LOG.md
Get-Content docs\CONTENT_WORKFLOW.md
git log --oneline -10
```

优先阅读：

- [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md)
- [CONTENT_WORKFLOW.md](CONTENT_WORKFLOW.md)

---

## 当前已知的重要文件

### 核心流程文档

- [README.md](../README.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [CONTENT_WORKFLOW.md](CONTENT_WORKFLOW.md)
- [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md)

### 数据入口

- [raids.json](data/raids.json)
- [spire_h1_afuzan.json](data/bosses/void_spire/spire_h1_afuzan.json)
- [spire_h2_fulasius.json](data/bosses/void_spire/spire_h2_fulasius.json)

### 关键脚本

- [md-to-boss-json.js](../scripts/md-to-boss-json.js)
- [validate-json.js](../scripts/validate-json.js)

### 关键前端文件

- [index.html](index.html)
- [style.css](assets/css/style.css)
- [data-loader.js](assets/js/data-loader.js)
- [renderers.js](assets/js/renderers.js)

---

## 下一步建议

优先级最高的后续工作：

1. 以 H1 / H2 新 schema 为模板，继续把 H3 / H4 / H5 / M1 / M2 转成结构化 JSON
2. 检查 `renderers.js` 是否已经完全适配新 schema 的所有字段区块
3. 把页面中仍残留的旧字段兼容逻辑清理掉，避免双结构并存
4. 每次大改后都追加本文件，记录：
   - 起止提交
   - 改了什么
   - 当前推荐开发入口
   - 注意事项

---

## 日志维护格式建议

后续每次追加日志时，建议按这个模板补在文档顶部：

```md
## YYYY-MM-DD / commit_hash

- 同步方式：
- 关键提交：
- 主要结构变化：
- 新增脚本或资源：
- 当前下一步：
```
