import express from 'express';
import passport from 'passport';
import { signup, login, logout, getMe, githubAuthCallback } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback', 
  passport.authenticate('github', { session: false, failureRedirect: 'http://localhost:5173/login?error=github_failed' }),
  githubAuthCallback
);

export default router;
