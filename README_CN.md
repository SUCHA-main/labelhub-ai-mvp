# LabelHub AI MVP

一个 AI 辅助数据标注平台原型，使用 React + Vite + Tailwind、Node.js + Express 和 JSON 文件存储实现。项目目标是快速演示“任务创建、动态表单标注、AI 质检、人工审核、统计看板”的最小闭环。

## 目录结构

```text
labelhub-ai-mvp/
  backend/          # Express API、JSON 文件数据存储、mockAIReview
  frontend/         # React + Vite + Tailwind 单页应用
  docker-compose.yml
  README_CN.md
```

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 前端 | React、Vite、Tailwind CSS |
| 后端 | Node.js、Express |
| 数据存储 | JSON 文件 |
| 部署 | Docker、docker-compose、Nginx |

## 本地启动

要求：Node.js 18+。

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

前端默认运行在 `http://localhost:5173`。Vite 已配置 `/api` 代理到后端。

## Docker 启动

要求：Docker 和 Docker Compose。

```bash
docker compose up --build
```

访问地址：`http://localhost:5173`。

后端 JSON 数据文件挂载在 `backend/data/tasks.json`，重启容器后数据仍保留在本地文件中。

## 演示账号

登录页无需真实密码，选择角色即可进入对应工作台：

| 角色 | 权限 |
| --- | --- |
| admin | 创建任务、查看全部任务和 dashboard |
| annotator | 查看待标注/被驳回任务，按 schema 填写动态表单并提交 |
| reviewer | 查看待审核任务，查看 AI 质检结果，选择通过或驳回 |

推荐演示用户名：`demo`。

## 演示流程

1. 使用 `admin` 角色登录，查看 dashboard 的任务总数、通过率、AI 风险提示数和待处理任务数。
2. 在管理员工作台查看预置任务，并创建一条新任务，展示动态 schema 能快速定义不同标注表单。
3. 切换到 `annotator` 角色，选择待标注任务，按页面自动渲染的表单提交标注结果。
4. 标注提交后，后端调用 `mockAIReview` 生成风险等级、置信度、问题提示和修改建议。
5. 切换到 `reviewer` 角色，查看待审核任务、标注结果和 AI 预审卡片。
6. 审核员填写审核意见，选择通过或驳回，dashboard 统计实时更新。

## 核心功能

1. 简单登录：支持 `admin`、`annotator`、`reviewer` 三种角色。
2. 管理员创建任务：任务包含标题、待标注文本和动态表单 schema。
3. 动态表单渲染：标注员根据 schema 自动生成输入控件。
4. AI 质检：标注提交后后端调用 `mockAIReview`，返回风险等级、置信度、问题提示和修改建议。
5. 人工审核：审核员可以通过或驳回任务，并填写审核意见。
6. Dashboard：展示任务总数、待标注数、待审核数、已通过数、已驳回数、通过率、AI 风险提示数和待处理任务数。

## 功能亮点

- 角色清晰：管理员、标注员、审核员三类视角覆盖真实标注协作流程。
- 表单灵活：任务 schema 可配置，适合情绪分类、商品标题质量、内容安全等不同标注场景。
- AI 辅助审核：提交标注后立即给出风险等级、置信度、问题提示和修改建议。
- 指标可视化：dashboard 能快速呈现任务进度、通过率和 AI 风险提示数。

## 项目截图

### 登录页

![登录页](docs/images/login.png)

### 管理员 Dashboard

![管理员 Dashboard](docs/images/admin-dashboard.png)

### 审核员 AI 预审

![审核员 AI 预审](docs/images/reviewer-ai-review.png)

### 审核结果

![审核结果](docs/images/review-result.png)

## Schema 示例

管理员创建任务时可填写 JSON 数组，字段支持 `text`、`textarea`、`select`、`number`、`checkbox`。

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
| --- | --- | --- |
| POST | `/api/login` | 演示登录 |
| GET | `/api/dashboard` | 获取统计数据 |
| GET | `/api/tasks` | 获取任务列表，可用 `status` 查询过滤 |
| POST | `/api/tasks` | 创建任务 |
| POST | `/api/tasks/:id/annotate` | 提交标注并触发 AI 质检 |
| POST | `/api/tasks/:id/review` | 审核通过或驳回 |

## 项目亮点

- 端到端闭环清晰：创建、标注、AI 质检、审核、统计全部可演示。
- 动态 schema 驱动表单：无需改前端代码即可创建不同标注任务。
- 结构化 AI 预审：用风险等级、置信度、问题提示和修改建议提升人工审核效率。
- 比赛展示友好：预置情绪分类、商品标题质量判断、内容安全审核 3 类任务，方便现场讲解业务覆盖面。
- Dashboard 指标直观：通过率、AI 风险提示数和待处理任务数能体现质量与效率。
- JSON 文件存储：降低部署和演示成本，便于后续替换为数据库。
- Docker 一键启动：适合快速本地评审和 MVP 演示。

## 后续可扩展方向

- 接入真实登录和权限校验。
- 将 JSON 文件替换为 SQLite、PostgreSQL 或 MongoDB。
- 将 `mockAIReview` 替换为真实 LLM/规则引擎服务。
- 增加任务分配、多人一致性统计和审核记录查询。
