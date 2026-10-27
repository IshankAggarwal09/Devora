import express from 'express';
import {
  createProblem,
  updateProblem,
  deleteProblem,
} from '../controllers/problem.controller.js';
import { adminGetProblems, adminGetProblemById } from '../controllers/admin.controller.js';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes in this file require authentication + admin role
router.use(protect, requireAdmin);

router.get('/problems', adminGetProblems);
router.get('/problems/:id', adminGetProblemById);
router.post('/problems', createProblem);
router.put('/problems/:id', updateProblem);
router.delete('/problems/:id', deleteProblem);

export default router;
