import express from 'express';
import { 
  createTask, 
  getAllTasks, 
  getTasksByStaff, 
  updateTaskStatus, 
  updateTask,
  deleteTask 
} from '../controllers/task.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Admin only
router.post('/tasks', authenticateToken, authorizeRoles('admin'), createTask);
router.get('/tasks', authenticateToken, authorizeRoles('admin'), getAllTasks);
router.patch('/tasks/:id', authenticateToken, authorizeRoles('admin'), updateTask);
router.delete('/tasks/:id', authenticateToken, authorizeRoles('admin'), deleteTask);

// Staff 
router.get('/tasks/staff', authenticateToken, authorizeRoles('staff'), getTasksByStaff);
router.patch('/tasks/:id/status', authenticateToken, authorizeRoles('staff'), updateTaskStatus);

export default router;

