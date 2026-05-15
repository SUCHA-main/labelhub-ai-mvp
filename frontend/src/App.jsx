import { useEffect, useState } from 'react';

const statusText = {
  pending_annotation: '待标注',
  pending_review: '待审核',
  approved: '已通过',
  rejected: '已驳回'
};

const schemaExample = JSON.stringify(
  [
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
  null,
  2
);

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || '请求失败');
  }
  return data;
}

function App() {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem('labelhub-session');
    return raw ? JSON.parse(raw) : null;
  });

  function handleLogin(nextSession) {
    localStorage.setItem('labelhub-session', JSON.stringify(nextSession));
    setSession(nextSession);
  }

  function handleLogout() {
    localStorage.removeItem('labelhub-session');
    setSession(null);
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Workspace session={session} onLogout={handleLogout} />;
}

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('demo');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const session = await request('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, role })
      });
      onLogin(session);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <section>
          <div className="mb-4 inline-flex rounded-full border border-cyan-400/40 px-4 py-1 text-sm text-cyan-200">
            AI Assisted Data Labeling
          </div>
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">LabelHub AI MVP</h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            一个可运行的 AI 辅助数据标注平台原型，覆盖任务创建、动态标注表单、AI 质检和人工审核闭环。
          </p>
        </section>

        <form onSubmit={submit} className="rounded-3xl bg-white p-6 text-slate-900 shadow-2xl">
          <h2 className="text-2xl font-semibold">演示登录</h2>
          <p className="mt-1 text-sm text-slate-500">选择角色即可进入对应工作台。</p>
          <label className="mt-6 block text-sm font-medium">用户名</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <label className="mt-4 block text-sm font-medium">角色</label>
          <select
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="admin">admin 管理员</option>
            <option value="annotator">annotator 标注员</option>
            <option value="reviewer">reviewer 审核员</option>
          </select>
          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="mt-6 w-full rounded-xl bg-cyan-600 px-4 py-3 font-semibold text-white hover:bg-cyan-700">
            进入工作台
          </button>
        </form>
      </div>
    </main>
  );
}

function Workspace({ session, onLogout }) {
  const [dashboard, setDashboard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const [dashboardData, taskData] = await Promise.all([
        request('/api/dashboard'),
        request('/api/tasks')
      ]);
      setDashboard(dashboardData);
      setTasks(taskData);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <main className="min-h-screen px-4 py-6 text-slate-900 md:px-8">
      <header className="mx-auto flex max-w-7xl flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">当前角色：{session.user.role}</p>
          <h1 className="text-2xl font-bold">LabelHub AI 工作台</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm">{session.user.username}</span>
          <button onClick={onLogout} className="rounded-full border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">
            退出
          </button>
        </div>
      </header>

      <section className="mx-auto mt-6 max-w-7xl">
        <Dashboard data={dashboard} />
        {message && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</p>}
        {loading && <p className="mt-4 text-sm text-slate-500">正在刷新数据...</p>}
      </section>

      <section className="mx-auto mt-6 max-w-7xl">
        {session.user.role === 'admin' && <AdminPanel onCreated={refresh} setMessage={setMessage} tasks={tasks} />}
        {session.user.role === 'annotator' && (
          <AnnotatorPanel tasks={tasks} onSubmitted={refresh} setMessage={setMessage} />
        )}
        {session.user.role === 'reviewer' && <ReviewerPanel tasks={tasks} onReviewed={refresh} setMessage={setMessage} />}
      </section>
    </main>
  );
}

function Dashboard({ data }) {
  const cards = [
    ['任务总数', data?.total ?? 0],
    ['待标注', data?.pendingAnnotation ?? 0],
    ['待审核', data?.pendingReview ?? 0],
    ['已通过', data?.approved ?? 0],
    ['已驳回', data?.rejected ?? 0]
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
      ))}
    </div>
  );
}

function AdminPanel({ tasks, onCreated, setMessage }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [schema, setSchema] = useState(schemaExample);

  async function createTask(event) {
    event.preventDefault();
    setMessage('');
    try {
      const parsedSchema = JSON.parse(schema);
      await request('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, text, schema: parsedSchema })
      });
      setTitle('');
      setText('');
      setSchema(schemaExample);
      setMessage('任务创建成功');
      onCreated();
    } catch (err) {
      setMessage(`创建失败：${err.message}`);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <form onSubmit={createTask} className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">创建标注任务</h2>
        <label className="mt-5 block text-sm font-medium">任务标题</label>
        <input className="mt-2 input" value={title} onChange={(event) => setTitle(event.target.value)} />
        <label className="mt-4 block text-sm font-medium">待标注文本</label>
        <textarea className="mt-2 input min-h-28" value={text} onChange={(event) => setText(event.target.value)} />
        <label className="mt-4 block text-sm font-medium">动态表单 schema</label>
        <textarea
          className="mt-2 input min-h-72 font-mono text-sm"
          value={schema}
          onChange={(event) => setSchema(event.target.value)}
        />
        <p className="mt-2 text-xs text-slate-500">字段支持 text、textarea、select、number、checkbox。</p>
        <button className="mt-5 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">
          创建任务
        </button>
      </form>

      <TaskList title="全部任务" tasks={tasks} />
    </div>
  );
}

function AnnotatorPanel({ tasks, onSubmitted, setMessage }) {
  const availableTasks = tasks.filter((task) => ['pending_annotation', 'rejected'].includes(task.status));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {availableTasks.length === 0 && <EmptyState text="暂无待标注任务" />}
      {availableTasks.map((task) => (
        <AnnotationCard key={task.id} task={task} onSubmitted={onSubmitted} setMessage={setMessage} />
      ))}
    </div>
  );
}

function AnnotationCard({ task, onSubmitted, setMessage }) {
  const initialValue = Object.fromEntries(task.schema.map((field) => [field.name, field.type === 'checkbox' ? false : '']));
  const [form, setForm] = useState(initialValue);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    try {
      await request(`/api/tasks/${task.id}/annotate`, {
        method: 'POST',
        body: JSON.stringify({ annotation: form })
      });
      setMessage('标注已提交，AI 质检结果已生成');
      onSubmitted();
    } catch (err) {
      setMessage(`提交失败：${err.message}`);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-sm">
      <TaskHeader task={task} />
      {task.review?.comment && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">驳回意见：{task.review.comment}</p>
      )}
      <div className="mt-5 rounded-2xl bg-slate-50 p-4 leading-7 text-slate-700">{task.text}</div>
      <div className="mt-5 space-y-4">
        {task.schema.map((field) => (
          <DynamicField key={field.name} field={field} value={form[field.name]} onChange={updateField} />
        ))}
      </div>
      <button className="mt-5 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white hover:bg-cyan-700">
        提交标注
      </button>
    </form>
  );
}

function ReviewerPanel({ tasks, onReviewed, setMessage }) {
  const reviewTasks = tasks.filter((task) => task.status === 'pending_review');
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {reviewTasks.length === 0 && <EmptyState text="暂无待审核任务" />}
      {reviewTasks.map((task) => (
        <ReviewCard key={task.id} task={task} onReviewed={onReviewed} setMessage={setMessage} />
      ))}
    </div>
  );
}

function ReviewCard({ task, onReviewed, setMessage }) {
  const [comment, setComment] = useState('');

  async function review(decision) {
    setMessage('');
    try {
      await request(`/api/tasks/${task.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ decision, comment })
      });
      setMessage(decision === 'approved' ? '审核已通过' : '任务已驳回');
      onReviewed();
    } catch (err) {
      setMessage(`审核失败：${err.message}`);
    }
  }

  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <TaskHeader task={task} />
      <div className="mt-5 rounded-2xl bg-slate-50 p-4 leading-7 text-slate-700">{task.text}</div>
      <KeyValueBlock title="标注结果" data={task.annotation} />
      <AIReview review={task.aiReview} />
      <label className="mt-5 block text-sm font-medium">审核意见</label>
      <textarea className="mt-2 input min-h-24" value={comment} onChange={(event) => setComment(event.target.value)} />
      <div className="mt-5 flex gap-3">
        <button onClick={() => review('approved')} className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700">
          通过
        </button>
        <button onClick={() => review('rejected')} className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700">
          驳回
        </button>
      </div>
    </article>
  );
}

function DynamicField({ field, value, onChange }) {
  const baseProps = {
    id: field.name,
    required: field.required,
    value: value ?? '',
    onChange: (event) => onChange(field.name, event.target.value),
    className: 'mt-2 input'
  };

  return (
    <label className="block text-sm font-medium" htmlFor={field.name}>
      {field.label || field.name}
      {field.required && <span className="text-red-500"> *</span>}
      {field.type === 'textarea' && <textarea {...baseProps} className="mt-2 input min-h-24" />}
      {field.type === 'select' && (
        <select {...baseProps}>
          <option value="">请选择</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
      {field.type === 'checkbox' && (
        <input
          id={field.name}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(field.name, event.target.checked)}
          className="mt-3 block h-5 w-5 rounded border-slate-300"
        />
      )}
      {field.type !== 'textarea' && field.type !== 'select' && field.type !== 'checkbox' && (
        <input {...baseProps} type={field.type === 'number' ? 'number' : 'text'} />
      )}
    </label>
  );
}

function TaskList({ title, tasks }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-5 space-y-4">
        {tasks.length === 0 && <EmptyState text="暂无任务" />}
        {tasks.map((task) => (
          <article key={task.id} className="rounded-2xl border border-slate-100 p-4">
            <TaskHeader task={task} />
            <p className="mt-3 line-clamp-2 text-sm text-slate-600">{task.text}</p>
            {task.aiReview && <AIReview review={task.aiReview} compact />}
          </article>
        ))}
      </div>
    </section>
  );
}

function TaskHeader({ task }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="font-semibold text-slate-950">{task.title}</h3>
        <p className="mt-1 text-xs text-slate-500">ID: {task.id}</p>
      </div>
      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
        {statusText[task.status] || task.status}
      </span>
    </div>
  );
}

function AIReview({ review, compact = false }) {
  if (!review) return null;
  return (
    <div className={`mt-5 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-cyan-950 ${compact ? 'mt-3' : ''}`}>
      <p className="font-semibold">AI 质检置信度：{Math.round(review.confidence * 100)}%</p>
      <p className="mt-2">风险提示：{review.risks?.join('；')}</p>
      {!compact && <p className="mt-2">修改建议：{review.suggestions?.join('；')}</p>}
    </div>
  );
}

function KeyValueBlock({ title, data }) {
  return (
    <div className="mt-5 rounded-2xl border border-slate-100 p-4">
      <h4 className="font-semibold">{title}</h4>
      <dl className="mt-3 space-y-2 text-sm">
        {Object.entries(data || {}).map(([key, value]) => (
          <div key={key} className="grid gap-1 sm:grid-cols-[120px_1fr]">
            <dt className="text-slate-500">{key}</dt>
            <dd className="text-slate-900">{String(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">{text}</div>;
}

export default App;
