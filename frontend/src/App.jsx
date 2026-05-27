import { useEffect, useState } from 'react';

const statusText = {
  pending_annotation: '待标注',
  pending_review: '待审核',
  approved: '已通过',
  rejected: '已驳回'
};

const statusIcon = {
  pending_annotation: '📝',
  pending_review: '🔍',
  approved: '✅',
  rejected: '❌'
};

const riskStyle = {
  低: 'border-emerald-100 bg-emerald-50 text-emerald-950',
  中: 'border-amber-100 bg-amber-50 text-amber-950',
  高: 'border-red-100 bg-red-50 text-red-950'
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
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ['📋', '动态表单', 'Schema 驱动，适配多场景'],
              ['🤖', 'AI 预审', '风险等级 + 置信度 + 建议'],
              ['👥', '三角色协作', '管理 · 标注 · 审核分离']
            ].map(([icon, title, desc]) => (
              <div key={title} className="rounded-2xl border border-slate-700/60 bg-slate-900/60 px-4 py-3">
                <p className="text-lg">{icon}</p>
                <p className="mt-1 text-sm font-semibold text-slate-100">{title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={submit} className="rounded-3xl bg-white p-6 text-slate-900 shadow-2xl">
          <h2 className="text-2xl font-semibold">演示登录</h2>
          <p className="mt-1 text-sm text-slate-500">选择角色即可进入对应工作台，无需密码。</p>
          <label className="mt-6 block text-sm font-medium">用户名</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <label className="mt-4 block text-sm font-medium">选择角色</label>
          <select
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="admin">admin - 管理员（创建任务、查看统计）</option>
            <option value="annotator">annotator - 标注员（填写标注表单）</option>
            <option value="reviewer">reviewer - 审核员（AI 预审 + 人工复核）</option>
          </select>
          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="mt-6 w-full rounded-xl bg-cyan-600 px-4 py-3 font-semibold text-white hover:bg-cyan-700">
            进入工作台 →
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
          <p className="text-sm text-slate-500">当前角色：{session.user.role === 'admin' ? '管理员' : session.user.role === 'annotator' ? '标注员' : '审核员'}</p>
          <h1 className="text-2xl font-bold">LabelHub AI 工作台</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm">{session.user.username}</span>
          <button onClick={onLogout} className="rounded-full border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">
            退出登录
          </button>
        </div>
      </header>

      <section className="mx-auto mt-6 max-w-7xl">
        <Dashboard data={dashboard} />
        {message && (
          <div className={`feedback-enter mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
            message.includes('失败') || message.includes('错误')
              ? 'bg-red-50 text-red-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}>
            <span>{message.includes('失败') || message.includes('错误') ? '✗' : '✓'}</span>
            {message}
          </div>
        )}
        {loading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <span className="spinner"></span>
            正在加载数据...
          </div>
        )}
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
    ['📊', '任务总数', data?.total ?? 0, 'bg-slate-50'],
    ['📝', '待标注', data?.pendingAnnotation ?? 0, 'bg-blue-50'],
    ['🔍', '待审核', data?.pendingReview ?? 0, 'bg-amber-50'],
    ['✅', '已通过', data?.approved ?? 0, 'bg-emerald-50'],
    ['❌', '已驳回', data?.rejected ?? 0, 'bg-red-50'],
    ['📈', '通过率', `${data?.passRate ?? 0}%`, 'bg-cyan-50'],
    ['⚠️', 'AI 风险提示', data?.aiRiskCount ?? 0, 'bg-orange-50'],
    ['⏳', '待处理', data?.pendingTotal ?? 0, 'bg-violet-50']
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(([icon, label, value, bg]) => (
        <div key={label} className={`rounded-2xl ${bg} p-4 shadow-sm`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
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
      setMessage('任务创建成功，已进入待标注队列');
      onCreated();
    } catch (err) {
      setMessage(`创建失败：${err.message}`);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <form onSubmit={createTask} className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">创建标注任务</h2>
        <p className="mt-1 text-sm text-slate-500">定义任务内容和标注表单结构</p>
        <label className="mt-5 block text-sm font-medium">任务标题</label>
        <input className="mt-2 input" placeholder="例如：电商评论情感分类" value={title} onChange={(event) => setTitle(event.target.value)} />
        <label className="mt-4 block text-sm font-medium">待标注文本</label>
        <textarea className="mt-2 input min-h-28" placeholder="粘贴需要标注的原始文本..." value={text} onChange={(event) => setText(event.target.value)} />
        <label className="mt-4 block text-sm font-medium">动态表单 Schema</label>
        <textarea
          className="mt-2 input min-h-72 font-mono text-sm"
          value={schema}
          onChange={(event) => setSchema(event.target.value)}
        />
        <p className="mt-2 text-xs text-slate-500">字段类型支持：text、textarea、select、number、checkbox</p>
        <button className="mt-5 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">
          创建任务
        </button>
      </form>

      <TaskList title="全部任务列表" tasks={tasks} />
    </div>
  );
}

function AnnotatorPanel({ tasks, onSubmitted, setMessage }) {
  const availableTasks = tasks.filter((task) => ['pending_annotation', 'rejected'].includes(task.status));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {availableTasks.length === 0 && <EmptyState text="暂无可标注任务，等待管理员创建新任务" icon="📋" />}
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
      setMessage('标注提交成功，AI 预审已完成');
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
        提交标注并触发 AI 质检
      </button>
    </form>
  );
}

function ReviewerPanel({ tasks, onReviewed, setMessage }) {
  const reviewTasks = tasks.filter((task) => task.status === 'pending_review');
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {reviewTasks.length === 0 && <EmptyState text="暂无可审核任务，等待标注员提交标注结果" icon="🔍" />}
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
      setMessage(decision === 'approved' ? '审核通过，任务已归档' : '已驳回，任务将返回标注员修改');
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
          ✓ 审核通过
        </button>
        <button onClick={() => review('rejected')} className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700">
          ✗ 驳回修改
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
        {tasks.length === 0 && <EmptyState text="暂无任务，请创建第一条标注任务" icon="📝" />}
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
      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
        {statusIcon[task.status]} {statusText[task.status] || task.status}
      </span>
    </div>
  );
}

function AIReview({ review, compact = false }) {
  if (!review) return null;
  const riskLevel = review.riskLevel || '低';
  const possibleIssue = review.possibleIssue || review.risks?.join('；') || '暂无问题提示';
  const suggestion = review.suggestion || review.suggestions?.join('；') || '暂无修改建议';

  return (
    <div className={`mt-5 rounded-2xl border p-4 text-sm ${riskStyle[riskLevel] || riskStyle['低']} ${compact ? 'mt-3' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">AI 预审结果</p>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">风险等级：{riskLevel}</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white/65 p-3">
          <p className="text-xs opacity-70">置信度</p>
          <p className="mt-1 text-2xl font-bold">{Math.round((review.confidence || 0) * 100)}%</p>
        </div>
        <div className="rounded-xl bg-white/65 p-3">
          <p className="text-xs opacity-70">问题提示</p>
          <p className="mt-1 font-medium">{possibleIssue}</p>
        </div>
      </div>
      {!compact && (
        <div className="mt-3 rounded-xl bg-white/65 p-3">
          <p className="text-xs opacity-70">修改建议</p>
          <p className="mt-1 font-medium">{suggestion}</p>
        </div>
      )}
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

function EmptyState({ text, icon = '📭' }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <p className="text-3xl">{icon}</p>
      <p className="mt-3 text-sm text-slate-500">{text}</p>
    </div>
  );
}

export default App;
