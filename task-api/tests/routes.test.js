const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});

// ─── POST /tasks ───────────────────────────────────────────────────────────────

describe('POST /tasks', () => {
  it('should create a task and return 201', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'New task', priority: 'high' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New task');
    expect(res.body.priority).toBe('high');
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('todo');
  });

  it('should return 400 when title is missing', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ priority: 'low' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 400 when title is empty string', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: '   ' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid status', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Task', status: 'invalid' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid priority', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Task', priority: 'urgent' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid dueDate', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Task', dueDate: 'not-a-date' });

    expect(res.status).toBe(400);
  });

  it('should accept a valid dueDate', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Task', dueDate: '2026-12-31T00:00:00.000Z' });

    expect(res.status).toBe(201);
    expect(res.body.dueDate).toBe('2026-12-31T00:00:00.000Z');
  });
});

// ─── GET /tasks ────────────────────────────────────────────────────────────────

describe('GET /tasks', () => {
  it('should return empty list initially', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should return all tasks', async () => {
    await request(app).post('/tasks').send({ title: 'A' });
    await request(app).post('/tasks').send({ title: 'B' });

    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

// ─── GET /tasks?status= ────────────────────────────────────────────────────────

describe('GET /tasks?status=', () => {
  beforeEach(async () => {
    await request(app).post('/tasks').send({ title: 'Todo', status: 'todo' });
    await request(app).post('/tasks').send({ title: 'Done', status: 'done' });
    await request(app).post('/tasks').send({ title: 'In Progress', status: 'in_progress' });
  });

  it('should filter tasks by status', async () => {
    const res = await request(app).get('/tasks?status=todo');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    res.body.forEach((t) => expect(t.status).toBe('todo'));
  });

  it('should return empty array for status with no matches', async () => {
    // Reset and only add one status
    taskService._reset();
    await request(app).post('/tasks').send({ title: 'X', status: 'todo' });

    const res = await request(app).get('/tasks?status=done');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ─── GET /tasks?page=&limit= ──────────────────────────────────────────────────

describe('GET /tasks?page=&limit=', () => {
  beforeEach(async () => {
    for (let i = 1; i <= 12; i++) {
      await request(app).post('/tasks').send({ title: `Task ${i}` });
    }
  });

  it('should paginate results', async () => {
    const res = await request(app).get('/tasks?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeLessThanOrEqual(5);
  });

  it('should return empty for page beyond data', async () => {
    const res = await request(app).get('/tasks?page=100&limit=5');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should default limit to 10 if not provided', async () => {
    const res = await request(app).get('/tasks?page=1');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeLessThanOrEqual(10);
  });
});

// ─── GET /tasks/stats ──────────────────────────────────────────────────────────

describe('GET /tasks/stats', () => {
  it('should return all-zero stats when no tasks', async () => {
    const res = await request(app).get('/tasks/stats');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ todo: 0, in_progress: 0, done: 0, overdue: 0 });
  });

  it('should return correct counts', async () => {
    await request(app).post('/tasks').send({ title: 'A', status: 'todo' });
    await request(app).post('/tasks').send({ title: 'B', status: 'done' });
    await request(app).post('/tasks').send({ title: 'C', status: 'in_progress' });

    const res = await request(app).get('/tasks/stats');
    expect(res.status).toBe(200);
    expect(res.body.todo).toBe(1);
    expect(res.body.done).toBe(1);
    expect(res.body.in_progress).toBe(1);
  });

  it('should count overdue tasks correctly', async () => {
    await request(app).post('/tasks').send({
      title: 'Overdue',
      status: 'todo',
      dueDate: '2020-01-01T00:00:00.000Z',
    });
    await request(app).post('/tasks').send({
      title: 'Future',
      status: 'todo',
      dueDate: '2099-01-01T00:00:00.000Z',
    });

    const res = await request(app).get('/tasks/stats');
    expect(res.body.overdue).toBe(1);
  });
});

// ─── PUT /tasks/:id ────────────────────────────────────────────────────────────

describe('PUT /tasks/:id', () => {
  it('should update an existing task', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Old' });
    const res = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ title: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
  });

  it('should return 404 for non-existent task', async () => {
    const res = await request(app)
      .put('/tasks/fake-id')
      .send({ title: 'X' });

    expect(res.status).toBe(404);
  });

  it('should return 400 for empty title', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Test' });
    const res = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ title: '' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid status', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Test' });
    const res = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ status: 'invalid_status' });

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /tasks/:id ─────────────────────────────────────────────────────────

describe('DELETE /tasks/:id', () => {
  it('should delete an existing task and return 204', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Remove me' });
    const res = await request(app).delete(`/tasks/${created.body.id}`);

    expect(res.status).toBe(204);

    // Verify it's gone
    const all = await request(app).get('/tasks');
    expect(all.body).toHaveLength(0);
  });

  it('should return 404 for non-existent task', async () => {
    const res = await request(app).delete('/tasks/fake-id');
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /tasks/:id/complete ─────────────────────────────────────────────────

describe('PATCH /tasks/:id/complete', () => {
  it('should mark a task as done', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Complete me' });
    const res = await request(app).patch(`/tasks/${created.body.id}/complete`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
    expect(res.body.completedAt).toBeDefined();
  });

  it('should return 404 for non-existent task', async () => {
    const res = await request(app).patch('/tasks/fake-id/complete');
    expect(res.status).toBe(404);
  });

  // BUG FIXED: completing preserves priority now
  it('should preserve priority when completing a task (bug fixed)', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Urgent', priority: 'high' });

    const res = await request(app).patch(`/tasks/${created.body.id}/complete`);
    expect(res.body.priority).toBe('high');
  });
});

// ─── PATCH /tasks/:id/assign ───────────────────────────────────────────────────

describe('PATCH /tasks/:id/assign', () => {
  it('should assign a task to a user', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Assign me' });
    const res = await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({ assignee: 'Gokul' });

    expect(res.status).toBe(200);
    expect(res.body.assignee).toBe('Gokul');
  });

  it('should return 404 for non-existent task', async () => {
    const res = await request(app)
      .patch('/tasks/non-existent-id/assign')
      .send({ assignee: 'Gokul' });

    expect(res.status).toBe(404);
  });

  it('should return 400 when assignee is missing', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Test' });
    const res = await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('should return 400 when assignee is empty string', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Test' });
    const res = await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({ assignee: '' });

    expect(res.status).toBe(400);
  });

  it('should return 400 when assignee is whitespace only', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Test' });
    const res = await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({ assignee: '   ' });

    expect(res.status).toBe(400);
  });

  it('should return 400 when assignee is not a string', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Test' });
    const res = await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({ assignee: 123 });

    expect(res.status).toBe(400);
  });

  it('should allow reassigning to a different user', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Test' });
    await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({ assignee: 'Alice' });

    const res = await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({ assignee: 'Bob' });

    expect(res.status).toBe(200);
    expect(res.body.assignee).toBe('Bob');
  });

  it('should not allow assigning a completed task', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Done task' });
    await request(app).patch(`/tasks/${created.body.id}/complete`);

    const res = await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({ assignee: 'Gokul' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
