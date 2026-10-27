import express from 'express';
import {
  createProject,
  getMyProjects,
  getProjectById,
  inviteMember,
  createTask,
  getProjectTasks,
  updateTask,
  createSprint,
  getProjectSprints,
  getSprintById,
  updateSprint,
  deleteSprint,
} from '../controllers/workspace.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All workspace routes require authentication
router.use(protect);

// ─── Projects ─────────────────────────────────────────────────────────────────
router.post('/projects', createProject);
router.get('/projects/mine', getMyProjects);
router.get('/projects/:projectId', getProjectById);
router.post('/projects/:projectId/invite', inviteMember);

// ─── Tasks ────────────────────────────────────────────────────────────────────
router.post('/projects/:projectId/tasks', createTask);
router.get('/projects/:projectId/tasks', getProjectTasks);
router.patch('/tasks/:taskId', updateTask);

// ─── Sprints (CRUD) ───────────────────────────────────────────────────────────
router.post('/projects/:projectId/sprints', createSprint);
router.get('/projects/:projectId/sprints', getProjectSprints);
router.get('/sprints/:sprintId', getSprintById);
router.patch('/sprints/:sprintId', updateSprint);
router.put('/sprints/:sprintId', updateSprint);
router.delete('/sprints/:sprintId', deleteSprint);

export default router;
