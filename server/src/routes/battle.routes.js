import express from 'express';
import {
  createBattle,
  joinBattle,
  getBattle,
} from '../controllers/battle.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createBattle);
router.post('/:roomCode/join', protect, joinBattle);
router.get('/:roomCode', protect, getBattle);

export default router;
