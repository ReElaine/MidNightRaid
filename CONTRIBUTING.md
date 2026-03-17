# Contributing Guide

本文档用于说明 `MidNightRaid` 仓库的日常整理流程，方便后续持续维护这些攻略文档。

## 工作目录

请先进入仓库目录：

```powershell
cd C:\Working\MidNightRaid
```

后续所有 Git 命令都建议在这个目录下执行。

## 日常更新流程

每次整理文档后，按下面顺序操作：

```powershell
git status
git add .
git commit -m "写一句本次修改内容"
git push
```

推荐理解为：

- `git status`：先看哪些文件发生了变化。
- `git add .`：把本次要提交的改动加入暂存区。
- `git commit -m "..."`：生成一次本地提交。
- `git push`：把本地提交推送到 GitHub。

## 推荐提交习惯

建议按“小步提交”的方式维护仓库，每整理完一个明确主题就提交一次。

例如：

```powershell
git commit -m "补充虚影尖塔 H3 攻略说明"
git commit -m "修正梦境裂隙图片引用"
git commit -m "更新 README 中的版权说明"
```

这样做的好处：

- 更容易回溯某次修改。
- 出问题时更容易定位。
- GitHub 提交历史会更清晰。

## 常用检查命令

整理文档时，下面几个命令最常用：

```powershell
git status
git diff
git log --oneline -5
```

它们分别表示：

- `git status`：查看当前有哪些改动、是否有未提交内容。
- `git diff`：查看具体改了哪些内容。
- `git log --oneline -5`：查看最近 5 次提交记录。

## 如果只想提交部分文件

如果你这次只想提交一部分改动，可以指定文件：

```powershell
git add README.md
git add NOTICE.md
git add "content/虚影尖塔/H3-陨落之王萨哈达尔.md"
git commit -m "更新虚影尖塔 H3 文档"
git push
```

这样不会把其他尚未整理完成的文件一起提交。

## 推送失败时怎么处理

如果 `git push` 失败，可以先检查当前状态：

```powershell
git status
git remote -v
```

再尝试重新推送：

```powershell
git push
```

如果 GitHub 提示需要先拉取更新，可以执行：

```powershell
git pull --rebase
git push
```

## 文档整理建议

为了让仓库长期更清晰，建议保持以下习惯：

- 尽量一次只整理一个副本或一个 Boss。
- 修改标题、目录或链接时，顺手检查 `README.md` 中是否需要同步更新。
- 如果新增来源说明、授权说明或版权说明，请同时更新 `README.md`、`NOTICE.md` 或 `LICENSE_GUIDE.md`。
- 如果引用了新的图片、截图或外部资料，尽量补充来源信息。

## 版权与授权提醒

本仓库采用 `CC BY-NC-SA 4.0` 协议，但该协议仅适用于维护者有权授权的内容。

在新增、整理或改写文档时，请注意：

- 尽量保留原始来源链接。
- 不要删除已有署名与来源说明。
- 对第三方内容保持谨慎，必要时在 `NOTICE.md` 中补充说明。

建议同时阅读：

- [README.md](README.md)
- [NOTICE.md](NOTICE.md)
- [LICENSE](LICENSE)
- [LICENSE_GUIDE.md](LICENSE_GUIDE.md)

## 一套最常用的完整示例

```powershell
cd C:\Working\MidNightRaid
git status
git diff
git add .
git commit -m "整理虚影尖塔部分攻略"
git push
```

这就是后续维护本仓库时最常见的一套流程。



