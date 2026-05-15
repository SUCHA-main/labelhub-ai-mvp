import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { readTasks, writeTasks } from './dataStore.js';
import { mockAIReview } from './mockAIReview.js';

const app = express();
const port = process.env.PORT || 4000;
const roles = ['admin', 'annotator', 'reviewer'];

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/login', (req, res) => {
  const { username = '', role } = req.body;
  if (!roles.includes(role)) {
    return res.status(400).json({ message: '不支持的角色' });
  }

  res.json({
    token: `demo-${role}-token`,
    user: {
      username: username.trim() || role,
      role
    }
  });
});

app.get('/api/dashboard', async (_req, res) => {
  const tasks = await readTasks();
  const approved = tasks.filter((task) => task.status === 'approved').length;
  const rejected = tasks.filter((task) => task.status === 'rejected').length;
  const reviewed = approved + rejected;
  const aiRiskCount = tasks.filter((task) => ['中', '高'].includes(task.aiReview?.riskLevel)).length;
  res.json({
    total: tasks.length,
    pendingAnnotation: tasks.filter((task) => task.status === 'pending_annotation').length,
    pendingReview: tasks.filter((task) => task.status === 'pending_review').length,
    approved,
    rejected,
    passRate: reviewed === 0 ? 0 : Math.round((approved / reviewed) * 100),
    aiRiskCount,
    pendingTotal: tasks.filter((task) => ['pending_annotation', 'pending_review', 'rejected'].includes(task.status)).length
  });
});

app.get('/api/tasks', async (req, res) => {
  const { status } = req.query;
  const tasks = await readTasks();
  const filtered = status ? tasks.filter((task) => task.status === status) : tasks;
  res.json(filtered);
});

app.get('/api/tasks/:id', async (req, res) => {
  const tasks = await readTasks();
  const task = tasks.find((item) => item.id === req.params.id);
  if (!task) {
    return res.status(404).json({ message: '任务不存在' });
  }
  res.json(task);
});

app.post('/api/tasks', async (req, res) => {
  const { title, text, schema } = req.body;
  if (!title?.trim() || !text?.trim() || !Array.isArray(schema) || schema.length === 0) {
    return res.status(400).json({ message: '标题、文本和 schema 必填' });
  }

  const now = new Date().toISOString();
  const task = {
    id: nanoid(10),
    title: title.trim(),
    text: text.trim(),
    schema,
    status: 'pending_annotation',
    annotation: null,
    aiReview: null,
    review: null,
    createdAt: now,
    updatedAt: now
  };

  const tasks = await readTasks();
  tasks.unshift(task);
  await writeTasks(tasks);
  res.status(201).json(task);
});

app.post('/api/tasks/:id/annotate', async (req, res) => {
  const { annotation } = req.body;
  const tasks = await readTasks();
  const task = tasks.find((item) => item.id === req.params.id);
  if (!task) {
    return res.status(404).json({ message: '任务不存在' });
  }
  if (task.status !== 'pending_annotation' && task.status !== 'rejected') {
    return res.status(400).json({ message: '当前任务不能提交标注' });
  }

  task.annotation = annotation || {};
  task.aiReview = mockAIReview(annotation);
  task.status = 'pending_review';
  task.review = null;
  task.updatedAt = new Date().toISOString();
  await writeTasks(tasks);
  res.json(task);
});

app.post('/api/tasks/:id/review', async (req, res) => {
  const { decision, comment = '' } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: '审核结论不合法' });
  }

  const tasks = await readTasks();
  const task = tasks.find((item) => item.id === req.params.id);
  if (!task) {
    return res.status(404).json({ message: '任务不存在' });
  }
  if (task.status !== 'pending_review') {
    return res.status(400).json({ message: '当前任务不在待审核状态' });
  }

  task.status = decision;
  task.review = {
    decision,
    comment,
    reviewedAt: new Date().toISOString()
  };
  task.updatedAt = new Date().toISOString();
  await writeTasks(tasks);
  res.json(task);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: '服务器内部错误' });
});

app.listen(port, () => {
  console.log(`LabelHub AI MVP backend listening on ${port}`);
});
