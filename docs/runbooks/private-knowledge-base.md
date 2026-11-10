# 私有地质知识库：上传、入库与检索

本指南适用于 MineralAgent 找矿助手前端分支。资料管理入口为管理员侧栏的「地质资料库」，评估入口保留为「RAG 评估」。

## 1. 先登录管理员账号

已有管理员账号时直接登录。首次注册选择「管理员」，填写服务端配置的 `ADMIN_INVITE_CODE`。邀请码从部署管理员处获得；本机工作区的服务配置在 `project/.env`。不要把邀请码、密码、Token 或 `.env` 提交到 GitHub。

普通账号可以进行资料问答和查看自己的历史对话，但不能通过前端上传或删除资料。

## 2. 准备一个小样本文档

本版文件选择器提供 PDF、DOCX、XLSX、HTML／HTM。建议先用几页包含清晰文字、标题和来源的地质资料验证，再批量导入。

- 扫描版 PDF 先做 OCR；目前没有完整扫描图件识别和复杂 PDF 表格结构恢复流水线。
- 旧 DOC／XLS 文件建议转为 DOCX／XLSX。通用 Loader 的支持不等于每个旧格式样本都能正确解析。
- 记录资料名称、年份、适用区域、矿种及来源；重要的表头和单位应能从提取文本中保留。
- 不建议把纯遥感栅格、GIS 工程或大幅图件当成普通文本报告上传；当前 UI 不提供影像分析工具。
- 上传大小、页数和单页字符限制以服务端 StorageSettings 为准。

## 3. 通过页面提交索引任务

1. 打开「地质资料库」。
2. 拖入文件或点击入库区域选择文件。
3. 点击「开始上传」。
4. 等待持久任务完成。过程包含候选版本准备、正文解析、三级分块、父块存储、向量／关键词索引及发布。
5. 确认文档出现在已发布列表中并有检索片段统计，再返回「找矿问答」。

单纯把文件放入本机 `data/sources` 不会自动入库。必须通过上传入口或受鉴权的文档 API 建立 Document Version 和 Index Job。

页面使用的正式接口：

| 功能 | 接口 |
| --- | --- |
| 查看资料 | `GET /documents` |
| 提交上传 | `POST /documents/upload/async`，multipart 字段为 `file` |
| 查询上传任务 | `GET /documents/upload/jobs/{job_id}` |
| 恢复任务列表 | `GET /documents/upload/jobs` |

上传 API 只提交任务，文件解析和模型计算由独立 indexing worker 处理。失败任务不会把未完成版本切换成当前版本。不要直接修改 PostgreSQL 或手工向 Milvus 塞无版本身份的向量。

## 4. 用原文可以核对的问题验收

第一轮问题应尽量具体，例如：「这份报告将某类蚀变分成哪几带？请引用出处」「对比两份文献对围岩蚀变的描述，分别说明来源」。

检查回答是否引用正确文件、页面或片段，是否保留单位和适用条件。没有资料时应说明无证据；命中相似文本不一定足以支持成矿预测。逐步加入无资料、模糊问题、冲突资料和跨文献比较样本，再使用保留的 RAG 评估工作台。

## 5. 私有性的实际边界

- 原文件、PostgreSQL、Redis 和 Milvus 索引位于当前部署，不会因为提交 Git 代码而自动上传 GitHub。
- 使用外部聊天模型时，问题、必要的检索片段及上下文会发给已配置的模型服务。RAG 评估同样可能把问题、答案和证据发给 Evaluator。敏感资料应使用组织允许的模型服务，或另行配置适当的本地模型服务。
- 当前默认知识空间由这套部署的授权账号共享；Thread 历史按用户隔离，但没有账号级独立知识库选择 UI。若需要严格按账号／项目隔离资料，需要进一步实现 Knowledge Base 选择和授权链路，不能仅靠改名称。
- Git 仓库只发布源码、模板和文档。`.env`、运行数据、资料、模型权重与日志不属于该版本提交内容。

## 6. 常见问题

| 现象 | 排查方向 |
| --- | --- |
| 看不到地质资料库入口 | 确认登录的是管理员角色 |
| 上传后长时间排队 | 检查 indexing worker、PostgreSQL、Milvus、Embedding 和 `/health/ready` |
| PDF 内容为空或乱码 | 检查是否扫描件、文本层和编码，先用小文件验证 Loader |
| 有旧版本但更新失败 | 旧发布版本保持可检索；查看新候选任务错误，不直接删除原索引 |
| 模型服务返回 401 | 检查服务端密钥和模型中心 Profile 的 Base URL 是否匹配；不是 GEO_MODE 问题 |
| 改 .env 后模型没有换 | 已有 Assignment 保存在数据库，需在模型中心为角色重新分配 |
| 前端改完没有显示 | 本机容器使用镜像中的 frontend/dist，前端 build 后还需重建应用镜像 |

## 7. 对应源码与测试

- 上传 UI：[UploadSection.vue](../../frontend/src/components/Documents/UploadSection.vue)。
- 文档状态与轮询：[documents.ts](../../frontend/src/stores/documents.ts)。
- API：[documents.py](../../backend/api/routes/documents.py)。
- 版本构建：[publication.py](../../backend/documents/publication.py)。
- 索引 worker：[worker.py](../../backend/documents/worker.py)。
- 浏览器上传回归：[capability-workflows.spec.ts](../../frontend/e2e/capability-workflows.spec.ts)。该测试使用 mock Job 验证浏览器流程，不代表真实地质文档已通过在线质量评估。
