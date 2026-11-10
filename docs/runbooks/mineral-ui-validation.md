# MineralAgent UI 验证记录

日期：2026-11-10。分支：`feat/mineral-assistant-ui`。上游基线：`e2ebabe81e066e0498bdb58000942ef5199d338c`。

## 变更范围

前端领域化为智能找矿助手。保留找矿问答、历史对话、资料库、模型中心与用户要求保留的 RAG 评估工作台。移除 SQL／Web／Sandbox、通用能力管理、工具审批和 Artifact 下载 UI。后端代码、鉴权、Run/Event/Checkpoint 及数据库迁移不变。

## 已运行检查

| 检查 | 结果 |
| --- | --- |
| Vue TypeScript 类型检查 | 通过 |
| Vite 构建与 bundle budget | 通过；入口初始 JavaScript gzip 约 70 KiB，低于原门禁 |
| Vitest | 22 个测试文件，196 项单测通过 |
| ESLint | 通过 |
| Prettier | 通过 |
| Playwright Chromium | 11 项浏览器回归通过 |
| 桌面与手机视觉检查 | 检查工作台截图；修复旧样式叠加、输入框宽度及移动导航问题 |

浏览器覆盖登录与注册、refresh 恢复、持久 Run 事件投影、历史切换、登出、模型创建／角色分配、RAG 评估 Job／Case、精简导航、问题示例填入、multipart 文档上传和任务完成、手机布局。能力白名单不把服务端 unavailable 改写为 available，并覆盖旧账号异步目录返回不污染新状态。

## 证明范围

浏览器测试使用 route mock；模拟 PDF 仅用于验证 multipart 和 Job UI，不测试真实 PDF 解析质量。没有通过这些测试宣称真实地质问答、上传私有文档或外部 Judge 已联调成功。私有文件、模型权重、数据库和凭据不属于提交内容。

构建命令及上传说明分别见项目 README 和 [私有知识库指南](private-knowledge-base.md)。
