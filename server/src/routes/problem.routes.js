import express from 'express';
import {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblems,
  getProblemBySlug,
  submitProblem,
} from '../controllers/problem.controller.js';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getProblems);
router.get('/:slug', getProblemBySlug);

router.post('/', protect, requireAdmin, createProblem);
router.put('/:id', protect, requireAdmin, updateProblem);
router.delete('/:id', protect, requireAdmin, deleteProblem);

router.post('/:id/submit', protect, submitProblem);

export default router;
