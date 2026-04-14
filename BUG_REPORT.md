# Bug Report

Bugs discovered through code review and testing of the Task Manager API.

---

## Bug 1: Pagination Off-By-One Error

**File:** `src/services/taskService.js`, line 12  
**Function:** `getPaginated(page, limit)`

**Expected:** Page 1 with limit 5 should return the first 5 tasks (index 0–4).  
**Actual:** Page 1 returns tasks at index 5–9 (items 6–10), because the offset is calculated as `page * limit` instead of `(page - 1) * limit`.

**How I discovered it:** Writing pagination tests — page 1 was returning the wrong set of tasks. Inspecting the offset formula confirmed the issue.

**Fix:**  
```js
// Before (broken)
const offset = page * limit;

// After (correct)
const offset = (page - 1) * limit;
```

---

## Bug 2: Status Filter Uses Substring Match Instead of Exact Match

**File:** `src/services/taskService.js`, line 9  
**Function:** `getByStatus(status)`

**Expected:** Filtering by `"do"` should return no tasks (no status equals `"do"`).  
**Actual:** Returns tasks with status `"done"` because `.includes()` does a substring match.

**How I discovered it:** Writing unit tests with partial status strings and noticing false positives.

**Fix:**  
```js
// Before (broken)
const getByStatus = (status) => tasks.filter((t) => t.status.includes(status));

// After (correct)
const getByStatus = (status) => tasks.filter((t) => t.status === status);
```

---

## Bug 3: `completeTask` Resets Priority to `'medium'`

**File:** `src/services/taskService.js`, lines 64–72  
**Function:** `completeTask(id)`

**Expected:** Completing a task should only change `status` to `"done"` and set `completedAt`. The task's priority should remain unchanged.  
**Actual:** Priority is hardcoded to `'medium'`, so a `"high"` priority task becomes `"medium"` on completion.

**How I discovered it:** Writing a test that creates a high-priority task, completes it, and checks that priority is preserved. It failed.

**Fix:**  
```js
// Before (broken)
const updated = {
  ...task,
  priority: 'medium',  // ← this line should not exist
  status: 'done',
  completedAt: new Date().toISOString(),
};

// After (correct)
const updated = {
  ...task,
  status: 'done',
  completedAt: new Date().toISOString(),
};
```

---

## Bug 4: `update()` Allows Overwriting Protected Fields

**File:** `src/services/taskService.js`, lines 48–53  
**Function:** `update(id, fields)`

**Expected:** Fields like `id`, `createdAt`, and `completedAt` should not be overwritable via `PUT /tasks/:id`.  
**Actual:** The spread `{ ...tasks[index], ...fields }` allows a client to send `{ "id": "anything" }` and overwrite the task's ID and other internal fields.

**How I discovered it:** Wrote a test that sends `id` and `createdAt` in the update body, and the values were overwritten.

**Fix:**  
```js
const update = (id, fields) => {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  // Destructure out protected fields, keep only allowed ones
  const { id: _id, createdAt: _ca, completedAt: _comp, ...safeFields } = fields;
  const updated = { ...tasks[index], ...safeFields };
  tasks[index] = updated;
  return updated;
};
```

---

## Summary

| # | Bug | Severity | Fixed? |
|---|-----|----------|--------|
| 1 | Pagination off-by-one | High | ✅ Yes |
| 2 | Status filter uses substring match | Medium | ✅ Yes |
| 3 | completeTask resets priority | Medium | ✅ Yes |
| 4 | update allows overwriting protected fields | High | ✅ Yes |
