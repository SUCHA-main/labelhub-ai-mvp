# LabelHub AI MVP：AI 辅助标注审核系统原型

一个前后端分离的 AI 辅助标注审核 MVP，使用 React + Express 实现，包含动态表单、mock AI 预审和人工复核流程。

## 项目简介

这个项目模拟数据标注团队中的核心工作流：管理员创建标注任务，标注员填写动态表单，系统触发 AI 预审，审核员根据 AI 建议做最终判断。

当前 AI 预审是基于规则的 mock 实现（关键词检测 + 答案长度判断），不是真实大模型接入。项目重点在于展示完整闭环和工程实现能力，而非构建生产级标注平台。

## 为什么做这个项目

真实的数据标注平台通常涉及任务分发、多人标注、质量检查、审核流转和统计看板，完整实现成本很高。

我想做的是：用 MVP 的方式抽取核心流程，做成一个可以运行、可以演示、可以写进简历的原型。重点展示我对"AI 辅助人工审核"这个场景的理解——AI 不是替代人，而是在人工审核前提供结构化的风险提示。

## 核心流程

```
管理员创建任务（定义 schema）
       ↓
标注员填写动态表单并提交
       ↓
系统触发 mock AI 预审
       ↓
审核员查看 AI 建议，通过或驳回
       ↓
Dashboard 统计更新
```

## 功能亮点

**三角色工作流**：Admin / Annotator / Reviewer 各有独立工作台，职责清晰分离，贴近真实标注团队协作模式。

**动态 Schema 表单**：任务通过 JSON schema 定义表单字段，前端自动渲染。支持 text、textarea、select、number、checkbox 五种类型，新增标注任务类型不需要改前端代码。

**Mock AI 预审**：标注提交后自动触发规则检查，返回风险等级（低/中/高）、置信度、问题提示和修改建议。展示的是 AI 审核层在产品流程中的位置，后续可替换为真实大模型。

**Dashboard 统计**：实时展示任务总数、待标注、待审核、已通过、已驳回、通过率、AI 风险提示数等指标。

**JSON 文件持久化**：MVP 阶段的存储方案，数据访问集中在 `dataStore.js`，后续可平滑替换为数据库。

**Docker 本地演示**：`docker compose up --build` 一键启动，前端 Nginx + 后端 Node.js，适合快速演示。

**完整文档**：中英文 README、演示脚本、项目总结，适合 GitHub 展示和项目答辩。

## 技术栈

| 模块 | 技术 |
|------|------|
| 前端 | React 18、Vite、Tailwind CSS |
| 后端 | Node.js、Express |
| 数据存储 | JSON 文件（MVP 方案） |
| AI 预审 | 基于规则的 mock 函数 |
| 部署 | Docker Compose、Nginx |

## 本地运行

要求：Node.js 18+

启动后端：

```bash
cd backend
npm install
npm run dev
```

后端默认运行在 `http://localhost:4000`。

启动前端：

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`，Vite 已配置 `/api` 代理到后端。

## Docker 运行

要求：Docker 和 Docker Compose。

```bash
docker compose up --build
```

访问 `http://localhost:5173`。

这是本地演示部署方案，后端 JSON 数据文件挂载在 `backend/data/tasks.json`，重启容器后数据仍保留。

## Demo 角色

登录无需密码，选择角色即可进入对应工作台：

| 角色 | 功能 |
|------|------|
| admin | 创建任务、查看 Dashboard 和全部任务 |
| annotator | 查看待标注任务，按 schema 填写动态表单并提交 |
| reviewer | 查看待审核任务和 AI 预审结果，选择通过或驳回 |

这是 demo 登录，不是真实认证系统。

## Mock AI 审核逻辑

标注提交后，后端调用 `mockAIReview` 函数：

1. **关键词检测**：检查标注内容是否包含"不确定"、"不知道"、"违规"等风险关键词
2. **答案长度检查**：检查是否有过短的回答（少于 2 个字符）
3. **结构化输出**：
   - `riskLevel`：风险等级（低/中/高）
   - `confidence`：置信度
   - `possibleIssue`：可能存在的问题
   - `suggestion`：修改建议

这不是为了假装真实 AI，而是为了保留 AI 审核层的接口位置。后续可以替换为 OpenAI、DeepSeek、Ollama 等真实大模型，或者自定义规则引擎。

## 当前边界

这个项目是 MVP 原型，需要诚实说明边界：

- 未接入真实大模型，AI 预审是基于规则的 mock
- 未接入数据库，使用 JSON 文件存储
- 未做真实认证和权限控制，使用 demo 角色登录
- 未做并发控制和任务锁定
- 未做审计日志
- 未做自动化测试

这些是后续扩展方向，不是当前能力。

## 后续扩展

**短期**：
- 接入真实 AI Provider（OpenAI-compatible API）
- 增加更多示例任务
- 改进错误处理

**中期**：
- 接入 SQLite 或 PostgreSQL
- 增加用户系统和真实认证
- 增加任务分配和审核日志

**长期**：
- 支持多人协作
- 支持批量导入导出
- 支持多模型评审
- 云服务器部署

## 可写入简历的项目描述

**简洁版**：
> AI 辅助数据标注审核 MVP，React + Express 前后端分离实现，包含动态表单、mock AI 预审和人工复核流程。

**标准版**：
> 独立完成 AI 辅助标注审核系统原型，使用 React + Vite + Tailwind 构建前端，Node.js + Express 构建后端。设计动态 Schema 驱动的标注表单系统，实现三角色（管理员/标注员/审核员）工作流，集成 mock AI 预审层提供结构化风险评估。支持 Docker 一键部署。

**面试展开版**：
> 这个项目想解决的是"AI 如何辅助人工审核"的问题。我设计了一个三角色工作流：管理员通过 JSON schema 定义标注表单，标注员填写后系统自动触发 AI 预审，审核员在同一页面查看原文、标注结果和 AI 建议再做判断。AI 预审当前是 mock 实现，但接口设计上可以平滑替换为真实大模型。技术栈是 React + Express 前后端分离，数据用 JSON 文件存储，Docker Compose 做本地部署。

## Schema 示例

管理员创建任务时可填写 JSON 数组，定义表单字段：

```json
[
  {
    "name": "sentiment",
    "label": "整体情绪",
    "type": "select",
    "options": ["正向", "中性", "负向"],
    "required": true
  },
  {
    "name": "reason",
    "label": "判断依据",
    "type": "textarea",
    "required": true
  }
]
```

## API 简览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/login` | Demo 登录 |
| GET | `/api/dashboard` | 获取统计数据 |
| GET | `/api/tasks` | 获取任务列表 |
| POST | `/api/tasks` | 创建任务 |
| POST | `/api/tasks/:id/annotate` | 提交标注并触发 AI 预审 |
| POST | `/api/tasks/:id/review` | 审核通过或驳回 |

## 项目截图

截图可放置在 `docs/images/` 目录下。

### 登录页

![登录页](docs/images/login.png)

### 管理员 Dashboard

![管理员 Dashboard](docs/images/admin-dashboard.png)

### 审核员 AI 预审

![审核员 AI 预审](docs/images/reviewer-ai-review.png)

### 审核结果

![审核结果](docs/images/review-result.png)

## 更多文档

- [English README](README.md)
- [演示脚本](docs/demo-script.md)
- [项目总结](docs/project-summary.md)
