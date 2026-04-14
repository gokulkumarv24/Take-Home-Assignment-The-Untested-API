const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});

// ─── CREATE ────────────────────────────────────────────────────────────────────

describe('taskService.create', () => {
  it('should create a task with default values', () => {
    const task = taskService.create({ title: 'Test task' });

    expect(task).toMatchObject({
      title: 'Test task',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      completedAt: null,
    });
    expect(task.id).toBeDefined();
    expect(task.createdAt).toBeDefined();
  });

  it('should create a task with all provided fields', () => {
    const task = taskService.create({
      title: 'Full task',
      description: 'A detailed description',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-12-31T00:00:00.000Z',
    });

    expect(task.title).toBe('Full task');
    expect(task.description).toBe('A detailed description');
    expect(task.status).toBe('in_progress');
    expect(task.priority).toBe('high');
    expect(task.dueDate).toBe('2026-12-31T00:00:00.000Z');
  });

  it('should generate unique IDs for each task', () => {
    const t1 = taskService.create({ title: 'Task 1' });
    const t2 = taskService.create({ title: 'Task 2' });
    expect(t1.id).not.toBe(t2.id);
  });
});

// ─── GET ALL ───────────────────────────────────────────────────────────────────

describe('taskService.getAll', () => {
  it('should return empty array when no tasks exist', () => {
    expect(taskService.getAll()).toEqual([]);
  });

  it('should return all created tasks', () => {
    taskService.create({ title: 'A' });
    taskService.create({ title: 'B' });
    const all = taskService.getAll();
    expect(all).toHaveLength(2);
  });

  it('should return a copy — modifying result should not affect store', () => {
    taskService.create({ title: 'Original' });
    const all = taskService.getAll();
    all.pop();
    expect(taskService.getAll()).toHaveLength(1);
  });
});

// ─── FIND BY ID ────────────────────────────────────────────────────────────────

describe('taskService.findById', () => {
  it('should find an existing task by ID', () => {
    const created = taskService.create({ title: 'Find me' });
    const found = taskService.findById(created.id);
    expect(found.title).toBe('Find me');
  });

  it('should return undefined for a non-existent ID', () => {
    expect(taskService.findById('non-existent')).toBeUndefined();
  });
});

// ─── GET BY STATUS ─────────────────────────────────────────────────────────────

describe('taskService.getByStatus', () => {
  it('should return tasks matching the given status', () => {
    taskService.create({ title: 'A', status: 'todo' });
    taskService.create({ title: 'B', status: 'done' });
    taskService.create({ title: 'C', status: 'todo' });

    const todos = taskService.getByStatus('todo');
    expect(todos).toHaveLength(2);
    todos.forEach((t) => expect(t.status).toBe('todo'));
  });

  it('should return empty array if no tasks match', () => {
    taskService.create({ title: 'A', status: 'todo' });
    const result = taskService.getByStatus('in_progress');
    expect(result).toEqual([]);
  });

  // BUG FIXED: uses strict equality now
  it('should not match partial status strings (was a bug, now fixed)', () => {
    taskService.create({ title: 'Done task', status: 'done' });
    taskService.create({ title: 'Todo task', status: 'todo' });

    const result = taskService.getByStatus('do');
    expect(result).toEqual([]); // Fixed: no substring matching
  });
});

// ─── GET PAGINATED ─────────────────────────────────────────────────────────────

describe('taskService.getPaginated', () => {
  beforeEach(() => {
    for (let i = 1; i <= 15; i++) {
      taskService.create({ title: `Task ${i}` });
    }
  });

  // BUG FIXED: offset is now (page - 1) * limit
  it('page 1 should return the first items (off-by-one was fixed)', () => {
    const page1 = taskService.getPaginated(1, 5);
    expect(page1).toHaveLength(5);
    expect(page1[0].title).toBe('Task 1');
    expect(page1[4].title).toBe('Task 5');
  });

  it('should return correct number of items per page', () => {
    const page = taskService.getPaginated(1, 3);
    expect(page.length).toBeLessThanOrEqual(3);
  });

  it('should return empty array for a page beyond the data', () => {
    const page = taskService.getPaginated(100, 10);
    expect(page).toEqual([]);
  });
});

// ─── GET STATS ─────────────────────────────────────────────────────────────────

describe('taskService.getStats', () => {
  it('should return zeroes when there are no tasks', () => {
    const stats = taskService.getStats();
    expect(stats).toEqual({ todo: 0, in_progress: 0, done: 0, overdue: 0 });
  });

  it('should count tasks by status correctly', () => {
    taskService.create({ title: 'A', status: 'todo' });
    taskService.create({ title: 'B', status: 'todo' });
    taskService.create({ title: 'C', status: 'in_progress' });
    taskService.create({ title: 'D', status: 'done' });

    const stats = taskService.getStats();
    expect(stats.todo).toBe(2);
    expect(stats.in_progress).toBe(1);
    expect(stats.done).toBe(1);
  });

  it('should count overdue tasks (past dueDate + not done)', () => {
    taskService.create({ title: 'Overdue', status: 'todo', dueDate: '2020-01-01T00:00:00.000Z' });
    taskService.create({ title: 'Not overdue', status: 'todo', dueDate: '2099-01-01T00:00:00.000Z' });
    taskService.create({ title: 'Done overdue', status: 'done', dueDate: '2020-01-01T00:00:00.000Z' });

    const stats = taskService.getStats();
    expect(stats.overdue).toBe(1);
  });
});

// ─── UPDATE ────────────────────────────────────────────────────────────────────

describe('taskService.update', () => {
  it('should update fields on an existing task', () => {
    const task = taskService.create({ title: 'Old title' });
    const updated = taskService.update(task.id, { title: 'New title' });
    expect(updated.title).toBe('New title');
    expect(updated.id).toBe(task.id);
  });

  it('should return null for a non-existent task', () => {
    const result = taskService.update('fake-id', { title: 'X' });
    expect(result).toBeNull();
  });

  // BUG FIXED: update no longer allows overwriting id/createdAt
  it('should not allow overwriting protected fields (id, createdAt)', () => {
    const task = taskService.create({ title: 'Test' });
    const originalId = task.id;
    const originalCreatedAt = task.createdAt;
    const updated = taskService.update(task.id, { id: 'hacked-id', createdAt: 'fake-date' });
    expect(updated.id).toBe(originalId);
    expect(updated.createdAt).toBe(originalCreatedAt);
  });
});

// ─── REMOVE ────────────────────────────────────────────────────────────────────

describe('taskService.remove', () => {
  it('should remove an existing task and return true', () => {
    const task = taskService.create({ title: 'Delete me' });
    expect(taskService.remove(task.id)).toBe(true);
    expect(taskService.getAll()).toHaveLength(0);
  });

  it('should return false for a non-existent task', () => {
    expect(taskService.remove('nope')).toBe(false);
  });
});

// ─── COMPLETE TASK ─────────────────────────────────────────────────────────────

describe('taskService.completeTask', () => {
  it('should mark a task as done and set completedAt', () => {
    const task = taskService.create({ title: 'Finish me' });
    const completed = taskService.completeTask(task.id);
    expect(completed.status).toBe('done');
    expect(completed.completedAt).toBeDefined();
  });

  it('should return null for a non-existent task', () => {
    expect(taskService.completeTask('nope')).toBeNull();
  });

  // BUG FIXED: completeTask no longer resets priority
  it('should preserve priority when completing a task (was a bug, now fixed)', () => {
    const task = taskService.create({ title: 'Urgent', priority: 'high' });
    const completed = taskService.completeTask(task.id);
    expect(completed.priority).toBe('high');
  });
});
