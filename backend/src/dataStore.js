import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'tasks.json');

const seedTasks = [
  {
    id: 'task-demo-1',
    title: '情绪分类样例',
    text: '这家店的服务很热情，但等待时间有点长。',
    schema: [
      {
        name: 'sentiment',
        label: '整体情绪',
        type: 'select',
        options: ['正向', '中性', '负向'],
        required: true
      },
      {
        name: 'reason',
        label: '判断依据',
        type: 'textarea',
        required: true
      }
    ],
    status: 'pending_annotation',
    annotation: null,
    aiReview: null,
    review: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(seedTasks, null, 2));
  }
}

export async function readTasks() {
  await ensureDataFile();
  const raw = await fs.readFile(dataFile, 'utf-8');
  return JSON.parse(raw);
}

export async function writeTasks(tasks) {
  await ensureDataFile();
  await fs.writeFile(dataFile, JSON.stringify(tasks, null, 2));
}
