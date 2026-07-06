import ioClient from 'socket.io-client';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import express from 'express';
import { createServer } from 'http';
import { initSocket } from './src/socket.js';
import User from './src/models/user.model.js';
import Problem from './src/models/problem.model.js';
import Battle from './src/models/battle.model.js';
import connectDB from './src/config/db.js';

dotenv.config();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  await connectDB();
  console.log('--- Phase 4 Scoring & Isolation Tests ---\n');

  // --- Mock Execution Engine (Port 5004) ---
  const mockEngineApp = express();
  mockEngineApp.use(express.json());
  mockEngineApp.post('/execute', (req, res) => {
    const { code } = req.body;
    if (code === 'wrong') return res.json({ verdict: 'wrong_answer', stdout: 'wrong' });
    if (code === 'right') return res.json({ verdict: 'success', stdout: 'test_output' });
    return res.json({ verdict: 'system_error' });
  });
  const mockEngineServer = mockEngineApp.listen(5004);
  process.env.EXECUTION_ENGINE_URL = 'http://localhost:5004';

  // --- Isolated Devora Server (Port 5003) ---
  const devoraApp = express();
  const devoraHttp = createServer(devoraApp);
  initSocket(devoraHttp);
  const devoraServer = devoraHttp.listen(5003);

  // Setup Users
  let users = await User.find().limit(3);
  if (users.length < 3) {
    await User.create({ name: 'Random', email: `rnd${Date.now()}@test.com`, passwordHash: 'x', githubId: 'x' });
    users = await User.find().limit(3);
  }
  const hostUser = users[0];
  const participantUser = users[1];
  
  const hostToken = jwt.sign({ id: hostUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const participantToken = jwt.sign({ id: participantUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Seed Problem
  let problem = await Problem.findOne({ title: 'Dummy Problem' });
  if (!problem) {
    problem = await Problem.create({
      title: 'Dummy Problem',
      slug: 'dummy-problem',
      description: 'Test',
      difficulty: 'medium', // 200 base points
      topics: ['test'],
      testCases: [{ input: 'test_input', expectedOutput: 'test_output', isSample: true }],
      timeLimit: 1000,
      memoryLimit: 256,
      createdBy: hostUser._id
    });
  }

  // Create Battle directly in DB (bypass REST to keep test concise)
  const roomCode = 'TSTBTL';
  await Battle.deleteOne({ roomCode });
  const battle = await Battle.create({
    roomCode,
    host: hostUser._id,
    participants: [{ user: hostUser._id }, { user: participantUser._id }],
    settings: { mode: 'random', difficulty: 'medium', questionCount: 1 },
    duration: 25,
    status: 'waiting'
  });

  // Connect Isolated Sockets
  const hostSocket = ioClient('http://localhost:5003', { extraHeaders: { Cookie: `token=${hostToken}` }, withCredentials: true });
  const participantSocket = ioClient('http://localhost:5003', { extraHeaders: { Cookie: `token=${participantToken}` }, withCredentials: true });

  await sleep(500);
  hostSocket.emit('battle:join', roomCode);
  participantSocket.emit('battle:join', roomCode);
  
  await sleep(500);
  hostSocket.emit('battle:start', roomCode);

  let problemId;
  await new Promise(resolve => {
    hostSocket.on('battle:started', payload => {
      problemId = payload.questions[0]._id;
      resolve();
    });
  });

  console.log('[TEST] Submitting 21 Wrong Answers to stack penalties...');
  for(let i=0; i < 21; i++) {
    participantSocket.emit('battle:submission', { roomCode, problemId, language: 'javascript', code: 'wrong' });
    await sleep(50); 
  }
  await sleep(1500);

  console.log('[TEST] Submitting System Error to verify it does not stack penalty...');
  participantSocket.emit('battle:submission', { roomCode, problemId, language: 'javascript', code: 'sys' });
  await sleep(1000);

  console.log('[TEST] Submitting Correct Answer...');
  participantSocket.emit('battle:submission', { roomCode, problemId, language: 'javascript', code: 'right' });

  await new Promise(resolve => {
    participantSocket.on('battle:ended', (leaderboard) => {
      console.log('\n✅ Battle Auto-Completed Check triggered.');
      const pData = leaderboard.find(p => (p.user._id || p.user).toString() === participantUser._id.toString());
      
      console.log(`\nResults for Participant:`);
      console.log(`- Score: ${pData.score} (Expected: 10 due to floor)`);
      console.log(`- Penalties: ${pData.penalties} (Expected: 21, verifying System Error was ignored)`);
      
      if (pData.score === 10 && pData.penalties === 21) {
        console.log('\n✅✅✅ Scoring Formula & Penalty Exclusions Perfect! ✅✅✅');
      } else {
        console.log('\n❌ Scoring Formula Failed!');
      }
      resolve();
    });
  });

  hostSocket.disconnect();
  participantSocket.disconnect();
  mockEngineServer.close();
  devoraServer.close();
  mongoose.connection.close();
  process.exit(0);
}

runTests();
