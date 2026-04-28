const express    = require('express');
const router     = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  toggleComplete,
} = require('../controllers/task.controller');

// Every task route requires a valid JWT
router.use(protect);

router.get('/',             getAllTasks);
router.get('/:id',          getTaskById);
router.post('/',            createTask);
router.put('/:id',          updateTask);
router.delete('/:id',       deleteTask);
router.patch('/:id/toggle', toggleComplete);

module.exports = router;