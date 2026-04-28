const { getDB } = require('../config/db');

// GET /api/tasks
function getAllTasks(req, res) {
  try {
    const db = getDB();
    let query = 'SELECT * FROM Tasks WHERE user_id = ?';
    const params = [req.user.id];

    const { priority, completed, search } = req.query;

    if (priority && priority !== 'all') {
      query += ' AND priority = ?';
      params.push(priority);
    }
    if (completed !== undefined && completed !== 'all') {
      query += ' AND completed = ?';
      params.push(completed === 'true' ? 1 : 0);
    }
    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const tasks = db.prepare(query).all(...params);
    res.json({ tasks });
  } catch (err) {
    console.error('GetAllTasks error:', err.message);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
}

// GET /api/tasks/:id
function getTaskById(req, res) {
  try {
    const db   = getDB();
    const task = db.prepare(
      'SELECT * FROM Tasks WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);

    if (!task)
      return res.status(404).json({ error: 'Task not found.' });

    res.json({ task });
  } catch (err) {
    console.error('GetTaskById error:', err.message);
    res.status(500).json({ error: 'Failed to fetch task.' });
  }
}

// POST /api/tasks
function createTask(req, res) {
  const { title, description, priority, due_date } = req.body;

  if (!title || title.trim().length < 3)
    return res.status(400).json({ error: 'Title must be at least 3 characters.' });

  try {
    const db     = getDB();
    const result = db.prepare(`
      INSERT INTO Tasks (user_id, title, description, priority, due_date)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      title.trim(),
      description || '',
      priority    || 'medium',
      due_date    || null
    );

    const task = db.prepare('SELECT * FROM Tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Task created', task });
  } catch (err) {
    console.error('CreateTask error:', err.message);
    res.status(500).json({ error: 'Failed to create task.' });
  }
}

// PUT /api/tasks/:id
function updateTask(req, res) {
  const { title, description, priority, due_date } = req.body;

  if (!title || title.trim().length < 3)
    return res.status(400).json({ error: 'Title must be at least 3 characters.' });

  try {
    const db     = getDB();
    const result = db.prepare(`
      UPDATE Tasks
      SET title       = ?,
          description = ?,
          priority    = ?,
          due_date    = ?,
          updated_at  = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(
      title.trim(),
      description || '',
      priority    || 'medium',
      due_date    || null,
      req.params.id,
      req.user.id
    );

    if (result.changes === 0)
      return res.status(404).json({ error: 'Task not found or not authorised.' });

    const task = db.prepare('SELECT * FROM Tasks WHERE id = ?').get(req.params.id);
    res.json({ message: 'Task updated', task });
  } catch (err) {
    console.error('UpdateTask error:', err.message);
    res.status(500).json({ error: 'Failed to update task.' });
  }
}

// DELETE /api/tasks/:id
function deleteTask(req, res) {
  try {
    const db     = getDB();
    const result = db.prepare(
      'DELETE FROM Tasks WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.user.id);

    if (result.changes === 0)
      return res.status(404).json({ error: 'Task not found or not authorised.' });

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('DeleteTask error:', err.message);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
}

// PATCH /api/tasks/:id/toggle
function toggleComplete(req, res) {
  try {
    const db     = getDB();
    const result = db.prepare(`
      UPDATE Tasks
      SET completed  = CASE WHEN completed = 1 THEN 0 ELSE 1 END,
          updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.user.id);

    if (result.changes === 0)
      return res.status(404).json({ error: 'Task not found.' });

    const task = db.prepare('SELECT * FROM Tasks WHERE id = ?').get(req.params.id);
    res.json({ message: 'Task toggled', task });
  } catch (err) {
    console.error('ToggleComplete error:', err.message);
    res.status(500).json({ error: 'Failed to toggle task.' });
  }
}

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  toggleComplete,
};