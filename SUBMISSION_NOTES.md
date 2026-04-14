# Submission Notes

## Coverage Summary

```
All files        |   95.48% Stmts | 90.69% Branch | 93.1% Funcs | 95.74% Lines
```

59 tests passing across unit tests (`taskService.test.js`) and integration tests (`routes.test.js`).

---

## Bugs Found & Fixed

4 bugs were found, documented in [BUG_REPORT.md](./BUG_REPORT.md), and all fixed:

1. **Pagination off-by-one** — `offset = page * limit` → `(page - 1) * limit`
2. **Status filter substring match** — `.includes()` → `===`
3. **completeTask resets priority** — removed hardcoded `priority: 'medium'`
4. **update allows overwriting protected fields** — destructure out `id`, `createdAt`, `completedAt` before spreading

---

## New Feature: `PATCH /tasks/:id/assign`

### Design Decisions

- **Validation:** Requires `assignee` to be a non-empty string (trims whitespace). Rejects missing, empty, whitespace-only, or non-string values with 400.
- **Completed tasks can't be assigned:** Returns 400 if the task's status is `done` — assigning work to a finished task doesn't make business sense.
- **Reassignment is allowed:** If a task is already assigned, sending a new `assignee` overwrites the previous one. This keeps the API simple — no need for a separate "unassign" endpoint for MVP.
- **Trimming input:** The assignee name is trimmed before storage to avoid names like `" Alice "`.

---

## What I'd Test Next

- Edge cases around date handling in `getStats` (timezone boundary conditions)
- Concurrent operations (e.g., what happens if two requests update the same task simultaneously)
- Response structure validation (ensuring no extra fields leak)
- Error handler middleware (the global error handler in `app.js`)
- Rate limiting / input size limits for production readiness

## What Surprised Me

- The `completeTask` function silently reset `priority` to `'medium'` — this would be very hard to catch without tests.
- The `getByStatus` using `.includes()` is subtle — it works for exact matches but breaks for any partial string.
- The `update` function had no protection for immutable fields — a client could overwrite `id` and effectively corrupt data.

## Questions Before Shipping to Production

- Should we add authentication/authorization? Currently any client can modify any task.
- What's the expected behavior for concurrent modifications? The in-memory store has no locking.
- Should there be a maximum number of tasks? The in-memory array could grow unbounded.
- Is there a need for audit logging (who changed what, when)?
- Should we persist data? The in-memory store resets on every restart.
