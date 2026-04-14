const express = require('express');
const taskRoutes = require('./routes/tasks');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Manager API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
    header { text-align: center; margin-bottom: 48px; }
    header h1 { font-size: 2.5rem; font-weight: 700; background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
    header p { color: #94a3b8; font-size: 1.1rem; }
    .badge { display: inline-block; background: #22c55e22; color: #4ade80; border: 1px solid #22c55e44; padding: 4px 14px; border-radius: 20px; font-size: 0.85rem; margin-top: 12px; }
    .section { margin-bottom: 36px; }
    .section h2 { font-size: 1.3rem; color: #94a3b8; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    .endpoint { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 18px 22px; margin-bottom: 12px; display: flex; align-items: center; gap: 16px; transition: border-color 0.2s; }
    .endpoint:hover { border-color: #818cf8; }
    .method { font-weight: 700; font-size: 0.8rem; padding: 6px 14px; border-radius: 6px; min-width: 72px; text-align: center; font-family: 'SF Mono', 'Consolas', monospace; }
    .get { background: #22c55e22; color: #4ade80; border: 1px solid #22c55e44; }
    .post { background: #3b82f622; color: #60a5fa; border: 1px solid #3b82f644; }
    .put { background: #f59e0b22; color: #fbbf24; border: 1px solid #f59e0b44; }
    .delete { background: #ef444422; color: #f87171; border: 1px solid #ef444444; }
    .patch { background: #a855f722; color: #c084fc; border: 1px solid #a855f744; }
    .path { font-family: 'SF Mono', 'Consolas', monospace; font-size: 0.95rem; color: #f1f5f9; flex: 1; }
    .desc { color: #94a3b8; font-size: 0.9rem; }
    .task-shape { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 22px; }
    .task-shape pre { font-family: 'SF Mono', 'Consolas', monospace; font-size: 0.9rem; color: #e2e8f0; line-height: 1.6; }
    .key { color: #818cf8; }
    .type { color: #4ade80; }
    .try-it { margin-top: 12px; }
    .try-link { color: #38bdf8; text-decoration: none; font-size: 0.85rem; font-family: 'SF Mono', 'Consolas', monospace; }
    .try-link:hover { text-decoration: underline; }
    footer { text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #334155; color: #64748b; font-size: 0.85rem; }
    footer a { color: #818cf8; text-decoration: none; }
    footer a:hover { text-decoration: underline; }
    .stats-box { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 16px; }
    .stat { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px; text-align: center; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #f1f5f9; }
    .stat-label { color: #94a3b8; font-size: 0.8rem; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Task Manager API</h1>
      <p>A RESTful API for managing tasks with full CRUD operations</p>
      <span class="badge">v1.0.0 &bull; Live</span>
    </header>

    <div class="section">
      <h2>Endpoints</h2>

      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/tasks</span>
        <span class="desc">List all tasks (supports ?status=, ?page=, ?limit=)</span>
      </div>
      <div class="try-it"><a class="try-link" href="/tasks" target="_blank">&#9654; Try /tasks</a></div>

      <div class="endpoint" style="margin-top: 12px;">
        <span class="method post">POST</span>
        <span class="path">/tasks</span>
        <span class="desc">Create a new task</span>
      </div>

      <div class="endpoint">
        <span class="method put">PUT</span>
        <span class="path">/tasks/:id</span>
        <span class="desc">Full update of a task</span>
      </div>

      <div class="endpoint">
        <span class="method delete">DELETE</span>
        <span class="path">/tasks/:id</span>
        <span class="desc">Delete a task (returns 204)</span>
      </div>

      <div class="endpoint">
        <span class="method patch">PATCH</span>
        <span class="path">/tasks/:id/complete</span>
        <span class="desc">Mark a task as complete</span>
      </div>

      <div class="endpoint">
        <span class="method patch">PATCH</span>
        <span class="path">/tasks/:id/assign</span>
        <span class="desc">Assign a task to a user</span>
      </div>

      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/tasks/stats</span>
        <span class="desc">Task counts by status + overdue count</span>
      </div>
      <div class="try-it"><a class="try-link" href="/tasks/stats" target="_blank">&#9654; Try /tasks/stats</a></div>
    </div>

    <div class="section">
      <h2>Task Schema</h2>
      <div class="task-shape">
        <pre>{
  <span class="key">"id"</span>:          <span class="type">string (uuid)</span>,
  <span class="key">"title"</span>:       <span class="type">string</span>,
  <span class="key">"description"</span>: <span class="type">string</span>,
  <span class="key">"status"</span>:      <span class="type">"todo" | "in_progress" | "done"</span>,
  <span class="key">"priority"</span>:    <span class="type">"low" | "medium" | "high"</span>,
  <span class="key">"dueDate"</span>:     <span class="type">ISO 8601 | null</span>,
  <span class="key">"assignee"</span>:    <span class="type">string | null</span>,
  <span class="key">"completedAt"</span>: <span class="type">ISO 8601 | null</span>,
  <span class="key">"createdAt"</span>:   <span class="type">ISO 8601</span>
}</pre>
      </div>
    </div>

    <div class="section">
      <h2>Live Stats</h2>
      <div class="stats-box" id="stats">
        <div class="stat"><div class="stat-value" id="todo">-</div><div class="stat-label">Todo</div></div>
        <div class="stat"><div class="stat-value" id="in_progress">-</div><div class="stat-label">In Progress</div></div>
        <div class="stat"><div class="stat-value" id="done">-</div><div class="stat-label">Done</div></div>
        <div class="stat"><div class="stat-value" id="overdue">-</div><div class="stat-label">Overdue</div></div>
      </div>
    </div>

    <footer>
      Built by <strong>Gokul Kumar V</strong> &bull;
      <a href="https://github.com/gokulkumarv24/Take-Home-Assignment-The-Untested-API" target="_blank">View on GitHub</a>
    </footer>
  </div>
  <script>
    fetch('/tasks/stats')
      .then(r => r.json())
      .then(data => {
        document.getElementById('todo').textContent = data.todo;
        document.getElementById('in_progress').textContent = data.in_progress;
        document.getElementById('done').textContent = data.done;
        document.getElementById('overdue').textContent = data.overdue;
      })
      .catch(() => {});
  </script>
</body>
</html>`);
});

app.use('/tasks', taskRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Task API running on port ${PORT}`);
  });
}

module.exports = app;
