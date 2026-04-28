const { getDB } = require('../config/db');

function rowsToObjects(result) {
  if (!result || result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map((row) => {
    const obj = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
}

function getAllTasks(req, res) {
  try {
    const db = getDB();
    let query = `SELECT * FROM Tasks WHERE user_id = ${req.user.id}`;

    const { priority, completed, search } = req.query;
    if (priority && priority !== 'all') query += ` AND priority = '${priority}'`;
    if (completed !== undefined && completed !== 'all')
      query += ` AND completed = ${completed === 'true' ? 1 : 0}`;
    if (search)
      query += ` AND (title LIKE '%${search}%' OR description LIKE '%${search}%')`;
    query += ' ORDER BY created_at DESC';

    const result = db.exec(query);
    res.json({ tasks: rowsToObjects(result) });
  } catch (err) {
    console.error('GetAllTasks error:', err.message);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
}

function getTaskById(req, res) {
  try {
    const db     = getDB();
    const result = db.exec(
      `SELECT * FROM Tasks WHERE id = ${req.params.id} AND user_id = ${req.user.id}`
    );
    const tasks  = rowsToObjects(result);
    if (tasks.length === 0)
      return res.status(404).json({ error: 'Task not found.' });
    res.json({ task: tasks[0] });
  } catch (err) {
    console.error('GetTaskById error:', err.message);
    res.status(500).json({ error: 'Failed to fetch task.' });
  }
}

function createTask(req, res) {
  const { title, description, priority, due_date } = req.body;
  if (!title || title.trim().length < 3)
    return res.status(400).json({ error: 'Title must be at least 3 characters.' });

  try {
    const db = getDB();
    db.run(
      `INSERT INTO Tasks (user_id, title, description, priority, due_date)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, title.trim(), description || '', priority || 'medium', due_date || null]
    );
    db.save();

    const result = db.exec(
      `SELECT * FROM Tasks WHERE user_id = ${req.user.id} ORDER BY id DESC LIMIT 1`
    );
    res.status(201).json({ message: 'Task created', task: rowsToObjects(result)[0] });
  } catch (err) {
    console.error('CreateTask error:', err.message);
    res.status(500).json({ error: 'Failed to create task.' });
  }
}

function updateTask(req, res) {
  const { title, description, priority, due_date } = req.body;
  if (!title || title.trim().length < 3)
    return res.status(400).json({ error: 'Title must be at least 3 characters.' });

  try {
    const db = getDB();
    db.run(
      `UPDATE Tasks SET title=?, description=?, priority=?, due_date=?, updated_at=datetime('now')
       WHERE id=? AND user_id=?`,
      [title.trim(), description || '', priority || 'medium', due_date || null, req.params.id, req.user.id]
    );
    db.save();

    const result = db.exec(`SELECT * FROM Tasks WHERE id = ${req.params.id}`);
    const tasks  = rowsToObjects(result);
    if (tasks.length === 0)
      return res.status(404).json({ error: 'Task not found.' });
    res.json({ message: 'Task updated', task: tasks[0] });
  } catch (err) {
    console.error('UpdateTask error:', err.message);
    res.status(500).json({ error: 'Failed to update task.' });
  }
}

function deleteTask(req, res) {
  try {
    const db = getDB();
    db.run(
      `DELETE FROM Tasks WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    db.save();
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('DeleteTask error:', err.message);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
}

function toggleComplete(req, res) {
  try {
    const db = getDB();
    db.run(
      `UPDATE Tasks SET completed = CASE WHEN completed=1 THEN 0 ELSE 1 END,
       updated_at = datetime('now') WHERE id=? AND user_id=?`,
      [req.params.id, req.user.id]
    );
    db.save();

    const result = db.exec(`SELECT * FROM Tasks WHERE id = ${req.params.id}`);
    res.json({ message: 'Task toggled', task: rowsToObjects(result)[0] });
  } catch (err) {
    console.error('ToggleComplete error:', err.message);
    res.status(500).json({ error: 'Failed to toggle task.' });
  }
}

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask, toggleComplete };