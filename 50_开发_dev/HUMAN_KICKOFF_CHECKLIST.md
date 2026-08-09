# Human Engineering Kickoff Checklist

正式让AI开发前，人类Owner只需确认：

## A. Repo
- [ ] 把 `Family_AI_Development_OS_V1.0/` 整个目录复制到项目仓库根目录
- [ ] 确认Git已启用
- [ ] 确认AI不能直接push main

## B. Environment
- [ ] DEV数据库可用
- [ ] Secrets不在Repo
- [ ] Node/pnpm版本可确定
- [ ] CI账号/权限可用

## C. Decision Rights
- [ ] Product Owner
- [ ] Domain Owner
- [ ] Architecture Owner
- [ ] Release Owner

## D. First Prompt
把 `START_DEVELOPMENT_PROMPT.txt` 原样发给Coding AI。

## E. Human Gate
AI完成TASK-000后，人先审核Audit。
不要让AI自动继续TASK-001，除非明确批准。
