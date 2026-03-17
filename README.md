# MidNightRaid

## 项目简介

MidNightRaid 正在从纯 Markdown 团本攻略仓库，逐步改造成“Markdown 内容层 + JSON 数据层 + GitHub Pages 静态站点”的双层结构项目。

- `content/` 保留原始攻略 Markdown，便于持续整理原文。
- `docs/data/` 提供可被前端直接读取的 JSON 数据层。
- `docs/` 提供可部署到 GitHub Pages 的原生静态站点。

## 在线攻略站

- GitHub Pages 占位链接：[https://reelaine.github.io/MidNightRaid/](https://reelaine.github.io/MidNightRaid/)
- 站点入口文件：[`docs/index.html`](docs/index.html)

## 项目结构说明

- `content/`：副本与 Boss 的原始 Markdown 内容层
- `docs/`：GitHub Pages 静态站点目录
- `docs/data/`：副本索引与 Boss JSON 数据
- `docs/assets/`：站点 CSS 与 JavaScript
- `scripts/validate-json.js`：JSON 结构校验脚本
- `assets/`：仓库现有图片与素材资源

## 使用说明

1. 平时整理原始攻略时，优先修改 `content/` 下的 Markdown。
2. 需要接入站点时，在 `docs/data/raids.json` 中登记 Boss 元数据，并为已结构化的 Boss 新增对应 JSON 文件。
3. 本地校验 JSON 时，可运行 `node scripts/validate-json.js`。
4. 启用 GitHub Pages 时，选择 `main` 分支下的 `/docs` 目录即可。

## 开源许可

本仓库当前采用双许可证结构：

- GitHub 主许可证显示：`GPL-3.0-or-later`
- 内容层：`CC BY-SA 4.0`
- 代码层：`GPL-3.0-or-later`

这套结构的目标是：

- 允许他人使用
- 必须保留来源
- 派生版本继续开源

请先阅读以下文件再进行转载、改编或再发布：

- [LICENSE](LICENSE)
- [LICENSE-CONTENT](LICENSE-CONTENT)
- [LICENSE-CODE](LICENSE-CODE)
- [LICENSE_GUIDE.md](LICENSE_GUIDE.md)
- [NOTICE.md](NOTICE.md)

# 12.0 新团本攻略（按副本 / Boss 拆分）

## 仓库维护

- 日常整理、提交与推送流程请见 [CONTRIBUTING.md](CONTRIBUTING.md)

----
## 实用分享
>
- 一键生成BOSS时间轴不求人

<https://bbs.nga.cn/read.php?tid=31289686&_ff=218>
- 12.0新团本：尖塔+奎岛+裂隙测试场地图+ ...

<https://raidplan.io/plan/create?exp=mn>
![img](assets/0_1001dcnc.png)

----
## 梦境裂隙

- [H奇美鲁斯,未梦之神(PTR)](content/梦境裂隙/H-奇美鲁斯,未梦之神(PTR).md)
- [M奇美鲁斯,未梦之神(PTR)](content/梦境裂隙/M-奇美鲁斯,未梦之神(PTR).md)


## 进军奎尔丹纳斯

- [H1贝洛朗,奥的子嗣(PTR)](content/进军奎尔丹纳斯/H1-贝洛朗,奥的子嗣(PTR).md)


## 虚影尖塔

- [H1元首阿福扎恩(PTR)](content/虚影尖塔/H1-元首阿福扎恩(PTR).md)
- [H2弗拉希乌斯(PTR)](content/虚影尖塔/H2-弗拉希乌斯(PTR).md)
- [H3陨落之王萨哈达尔(PTR)](content/虚影尖塔/H3-陨落之王萨哈达尔(PTR).md)
- [H4威厄高尔和艾佐拉克(PTR)](content/虚影尖塔/H4-威厄高尔和艾佐拉克(PTR).md)
- [H5光盲先锋军(PTR)](content/虚影尖塔/H5-光盲先锋军(PTR).md)
- [M1元首阿福扎恩(PTR)](content/虚影尖塔/M1-元首阿福扎恩(PTR).md)
- [M2弗拉希乌斯(PTR)](content/虚影尖塔/M2-弗拉希乌斯(PTR).md)

----

## 版权与授权说明

本仓库采用双许可证结构发布：

- 根目录 `LICENSE` 使用标准 GPL 文本，以便 GitHub 识别主许可证。
- 内容层：`CC BY-SA 4.0`
- 代码层：`GPL-3.0-or-later`

但这些协议仅适用于仓库中由维护者依法有权授权的内容。

这意味着：

- 你可以转载、分享、整理、修改本仓库中可授权的内容。
- 你必须保留署名，并给出原仓库链接或协议链接。
- 你在使用内容层时必须保留署名与来源，并在改编再发布时继续采用 ShareAlike 方式开放。
- 你在使用代码层时必须保留版权与许可证声明，并在分发修改版时继续采用 GPL 开源。

请特别注意：

- 本仓库包含整理自现有攻略帖子与参考资料的内容。
- 原始帖子作者、发布平台、截图作者及其他相关权利人，仍然保留各自对应的权利。
- 若某些文本、图片、媒体链接或引用内容不属于仓库维护者可再次授权的范围，则这些部分不因仓库整体协议而自动获得再次授权。

发布、转载或二次改编前，建议先阅读以下文件：

- [LICENSE](LICENSE)
- [LICENSE-CONTENT](LICENSE-CONTENT)
- [LICENSE-CODE](LICENSE-CODE)
- [NOTICE.md](NOTICE.md)
- [LICENSE_GUIDE.md](LICENSE_GUIDE.md)

如果你是相关权利人，并认为仓库中的某部分内容需要修正署名、补充来源或移除，请联系仓库维护者处理。
