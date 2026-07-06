import io from 'socket.io-client';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from './src/models/user.model.js';
import Problem from './src/models/problem.model.js';
import connectDB from './src/config/db.js';

dotenv.config();

// Utility for sleeping
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  await connectDB();
  
  console.log('--- Phase 4 Socket/REST Tests ---');
  
  // Find two users for testing
  const users = await User.find().limit(2);
  if (users.length < 2) {
    console.error('Need at least 2 users in the DB to run tests.');
    process.exit(1);
  }
  
  const hostUser = users[0];
  const participantUser = users[1];
  
  // Generate JWTs for them
  const hostToken = jwt.sign({ id: hostUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const participantToken = jwt.sign({ id: participantUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  console.log(`Host: ${hostUser.name}`);
  console.log(`Participant: ${participantUser.name}`);

  // Seed a dummy problem if none exists
  let problem = await Problem.findOne();
  if (!problem) {
    console.log('No problems found in DB. Seeding a dummy problem...');
    problem = await Problem.create({
      title: 'Dummy Problem',
      slug: 'dummy-problem',
      description: 'Just a test',
      difficulty: 'medium',
      topics: ['test'],
      testCases: [{ input: 'test_input', expectedOutput: 'test_output', isSample: true }],
      timeLimit: 1000,
      memoryLimit: 256,
      createdBy: hostUser._id
    });
  }

  // 1. Create a Battle (REST)
  console.log('\n[TEST] 1. Creating Battle...');
  let response = await fetch('http://localhost:5000/api/battles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${hostToken}`
    },
    body: JSON.stringify({
      settings: {
        mode: 'random',
        difficulty: 'mixed',
        questionCount: 1
      },
      duration: 25 // 25 mins
    })
  });
  
  if (!response.ok) {
    const err = await response.json();
    console.error('Failed to create battle:', err);
    process.exit(1);
  }
  
  const battle = await response.json();
  const roomCode = battle.roomCode;
  console.log(`Battle created successfully! Room Code: ${roomCode}`);
  
  // 2. Second User Joins (REST)
  console.log('\n[TEST] 2. Participant Joining via REST...');
  response = await fetch(`http://localhost:5000/api/battles/${roomCode}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${participantToken}`
    }
  });
  
  if (!response.ok) {
    const err = await response.json();
    console.error('Failed to join battle:', err);
    process.exit(1);
  }
  console.log('Participant joined successfully!');

  // 3. Connect Sockets
  console.log('\n[TEST] 3. Connecting Sockets...');
  
  const hostSocket = io('http://localhost:5000', {
    extraHeaders: {
      Cookie: `token=${hostToken}`
    },
    withCredentials: true
  });
  
  const participantSocket = io('http://localhost:5000', {
    extraHeaders: {
      Cookie: `token=${participantToken}`
    },
    withCredentials: true
  });

  await new Promise((resolve) => {
    let connected = 0;
    const check = () => { connected++; if (connected === 2) resolve(); };
    hostSocket.on('connect', check);
    participantSocket.on('connect', check);
  });
  console.log('Sockets connected for both users!');

  // Setup listeners for logging
  participantSocket.on('battle:participant_joined', (participants) => {
     console.log(`[Socket] -> battle:participant_joined | Total participants: ${participants.length}`);
  });

  hostSocket.on('battle:error', (msg) => console.log(`[Socket Error Host] -> ${msg}`));
  participantSocket.on('battle:error', (msg) => console.log(`[Socket Error Part] -> ${msg}`));

  // 4. Join Socket Rooms
  console.log('\n[TEST] 4. Emitting battle:join...');
  hostSocket.emit('battle:join', roomCode);
  participantSocket.emit('battle:join', roomCode);
  
  await sleep(1000);

  // 5. Host Starts Battle
  console.log('\n[TEST] 5. Host Emitting battle:start...');
  hostSocket.emit('battle:start', roomCode);

  let problemIdToSolve = null;

  await new Promise((resolve) => {
     hostSocket.on('battle:started', (payload) => {
       console.log(`[Socket] -> battle:started | Duration: ${payload.duration}m, Questions: ${payload.questions.length}`);
       problemIdToSolve = payload.questions[0]._id;
       resolve();
     });
  });

  // 6. Submit correct answer
  console.log('\n[TEST] 6. Submitting code for problem...');
  // Since we don't have the execution engine actually running in this script loop unless it's running via `npm run dev` in the other terminal,
  // We will emit the submission and watch what happens. (If the engine is down, it will log a System Error on the socket).
  
  participantSocket.emit('battle:submission', {
     roomCode,
     problemId: problemIdToSolve,
     language: 'cpp',
     code: 'int main() { return 0; }'
  });

  hostSocket.on('battle:leaderboard_update', (leaderboard) => {
     console.log('\n[Socket] -> battle:leaderboard_update');
     leaderboard.forEach(p => console.log(` - ${p.user.name}: Score ${p.score}, Penalties ${p.penalties}`));
  });

  hostSocket.on('battle:ended', (leaderboard) => {
     console.log('\n[Socket] -> battle:ended');
     console.log('Final Leaderboard:');
     leaderboard.forEach(p => console.log(` - ${p.user.name}: Score ${p.score}, Penalties ${p.penalties}`));
     
     // Clean up
     hostSocket.disconnect();
     participantSocket.disconnect();
     process.exit(0);
  });

  // Wait 15s to see the timer sync and potential grading result
  await sleep(15000);
  
  console.log('\n[TEST] 7. Test completed (waited 15s). Closing sockets.');
  hostSocket.disconnect();
  participantSocket.disconnect();
  process.exit(0);
}

runTests();
