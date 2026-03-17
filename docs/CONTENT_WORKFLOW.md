# Content Workflow

本文档说明当前仓库推荐的攻略维护流程：先维护 Markdown，再由脚本转换成站点使用的 JSON。

## 目标

- `content/` 作为唯一人工维护入口
- `docs/data/` 作为站点渲染使用的数据层
- 通过脚本减少手工同步 JSON 的重复工作

## 当前流程

1. 编辑 `content/` 里的 Boss Markdown
2. 运行 `scripts/md-to-boss-json.js` 把 Markdown 转成对应 JSON
3. 运行 `scripts/validate-json.js` 做结构校验
4. 本地确认无误后提交并推送

## Markdown 模板

当前转换脚本要求 Boss Markdown 使用以下固定结构：

```md
# H1 某个 Boss

> 副本：虚影尖塔
> 难度：英雄
> 维护说明：后续请优先直接更新这份 Markdown，我会按这份结构同步回 JSON。

## 战斗摘要
### 一句话
### 战斗类型
### 击杀条件

## 开荒速览
### Boss 站位
### 优先目标
### 核心循环
### 治疗压力点
### 常见灭团点

## 职责提示
### Tank
### Healer
### DPS

## 技能详解
### 技能名 A
- 分类：...
- 严重度：...

技能描述正文

Tank：
- ...

Healer：
- ...

DPS：
- ...

![图片说明](../../docs/assets/media/void_spire/example.gif)

## 时间轴
| 时间 | 技能 | 备注 |
| --- | --- | --- |
| 0:10 | 某技能 | 某说明 |
```

## 转换命令

转换单个 Boss：

```powershell
node scripts/md-to-boss-json.js spire_h1_afuzan_ptr
```

也可以用 `contentPath` 作为目标：

```powershell
node scripts/md-to-boss-json.js "content/虚影尖塔/H1-元首阿福扎恩.md"
```

转换完成后校验：

```powershell
node scripts/validate-json.js
```

## 注意事项

- `技能详解` 中每个 `###` 小节都会转换成一个 ability
- `Tank：`、`Healer：`、`DPS：` 三段会转换成 `response`
- 第一张图片会作为该技能的 `media`
- `时间轴` 中的“技能”列会尽量自动匹配到同名或前缀匹配的 ability
- 现有 Boss JSON 的 ability id 和 timeline abilityId 会尽量保留，不会每次重生随机 id

## 推荐操作

```powershell
git status
node scripts/md-to-boss-json.js spire_h1_afuzan_ptr
node scripts/md-to-boss-json.js spire_h2_fulasius_ptr
node scripts/validate-json.js
git diff
git add .
git commit -m "docs: update boss guide content"
git push
```
