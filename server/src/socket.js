import { Server } from 'socket.io';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import User from './models/user.model.js';
import Battle from './models/battle.model.js';
import Problem from './models/problem.model.js';

// Reusable logic from Phase 3, adapted for sockets
const EXEC_URL = process.env.EXECUTION_ENGINE_URL || 'http://localhost:5001';

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true,
    },
  });

  // 1. Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const rawCookies = socket.request.headers.cookie;
      if (!rawCookies) {
        return next(new Error('Authentication error: No cookies found'));
      }

      const parsedCookies = cookie.parse(rawCookies);
      const token = parsedCookies.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // 2. Event Listeners
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.name} (${socket.id})`);

    // --- battle:join ---
    socket.on('battle:join', async (roomCode) => {
      try {
        const battle = await Battle.findOne({ roomCode }).populate('participants.user', 'name avatarUrl githubId');
        if (!battle) {
          return socket.emit('battle:error', 'Battle not found');
        }

        // Verify they are in the participants array (REST should have done this)
        const isParticipant = battle.participants.some(p => p.user._id.toString() === socket.user._id.toString());
        if (!isParticipant) {
          return socket.emit('battle:error', 'Not a participant in this battle');
        }

        socket.join(roomCode);
        
        // Broadcast to others in room
        io.to(roomCode).emit('battle:participant_joined', battle.participants);
        
      } catch (err) {
        console.error('Socket join error:', err);
      }
    });

    // --- battle:start ---
    socket.on('battle:start', async (roomCode) => {
      try {
        const battle = await Battle.findOne({ roomCode, status: 'waiting' });
        if (!battle) return;

        // Verify host
        if (battle.host.toString() !== socket.user._id.toString()) {
          return socket.emit('battle:error', 'Only the host can start the battle');
        }

        // Question Selection Logic (Step 5)
        const matchQuery = {};
        if (battle.settings.mode === 'topic' && battle.settings.topics.length > 0) {
          matchQuery.topics = { $in: battle.settings.topics };
        }
        if (battle.settings.difficulty !== 'mixed') {
          matchQuery.difficulty = battle.settings.difficulty;
        }

        const selectedProblems = await Problem.aggregate([
          { $match: matchQuery },
          { $sample: { size: battle.settings.questionCount } }
        ]);

        if (selectedProblems.length < battle.settings.questionCount) {
          return socket.emit('battle:error', `Not enough problems available. Requested: ${battle.settings.questionCount}, Found: ${selectedProblems.length}.`);
        }

        // Update Battle State
        battle.questions = selectedProblems.map(p => p._id);
        battle.status = 'in_progress';
        battle.startedAt = Date.now();
        await battle.save();

        // Safe problem broadcast (strip testCases)
        const safeProblems = selectedProblems.map(p => {
           const safe = { ...p };
           delete safe.testCases;
           return safe;
        });

        io.to(roomCode).emit('battle:started', {
          startedAt: battle.startedAt,
          duration: battle.duration,
          questions: safeProblems
        });

        // Start Timer Sync Heartbeat
        const syncInterval = setInterval(async () => {
          // Check if battle still exists/in progress
          const currentBattle = await Battle.findById(battle._id);
          if (!currentBattle || currentBattle.status !== 'in_progress') {
            clearInterval(syncInterval);
            return;
          }

          // Check if time is up
          const timeElapsed = Date.now() - currentBattle.startedAt.getTime();
          if (timeElapsed >= currentBattle.duration * 60 * 1000) {
             // End Battle
             clearInterval(syncInterval);
             currentBattle.status = 'completed';
             currentBattle.endedAt = Date.now();
             await currentBattle.save();
             
             // Final Tally & Sort (Step 12)
             const finalLeaderboard = currentBattle.participants.sort((a, b) => {
               if (b.score !== a.score) return b.score - a.score;
               if (!a.lastAcceptedAt) return 1;
               if (!b.lastAcceptedAt) return -1;
               return a.lastAcceptedAt.getTime() - b.lastAcceptedAt.getTime();
             });

             io.to(roomCode).emit('battle:ended', finalLeaderboard);
          } else {
             io.to(roomCode).emit('battle:timer_sync', { serverTime: Date.now() });
          }
        }, 10000);

      } catch (err) {
        console.error('Socket start error:', err);
      }
    });

    // --- battle:submission ---
    socket.on('battle:submission', async ({ roomCode, problemId, language, code }) => {
      try {
        const battle = await Battle.findOne({ roomCode, status: 'in_progress' });
        if (!battle) return socket.emit('battle:error', 'Battle is not in progress');

        // Verify time hasn't naturally expired before the interval caught it
        const timeElapsed = Date.now() - battle.startedAt.getTime();
        if (timeElapsed >= battle.duration * 60 * 1000) {
           return socket.emit('battle:error', 'Battle time has expired');
        }

        const participantIndex = battle.participants.findIndex(p => p.user.toString() === socket.user._id.toString());
        if (participantIndex === -1) return;
        const participant = battle.participants[participantIndex];

        // Check if already solved
        const alreadySolved = participant.solvedProblems.some(sp => sp.problem.toString() === problemId && sp.verdict === 'Accepted');
        if (alreadySolved) {
           return socket.emit('battle:error', 'Problem already solved');
        }

        const problem = await Problem.findById(problemId);
        if (!problem) return;

        let finalVerdict = 'Accepted';
        for (let i = 0; i < problem.testCases.length; i++) {
          const tc = problem.testCases[i];
          let execRes;
          try {
            const response = await fetch(`${EXEC_URL}/execute`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                language,
                code,
                input: tc.input,
                timeLimit: problem.timeLimit,
                memoryLimit: problem.memoryLimit
              })
            });
            execRes = await response.json();
          } catch (err) {
             finalVerdict = 'System Error';
             break;
          }

          if (execRes.verdict === 'system_error') { finalVerdict = 'System Error'; break; }
          if (execRes.verdict === 'compile_error') { finalVerdict = 'Compile Error'; break; }
          if (execRes.verdict === 'timeout') { finalVerdict = 'Time Limit Exceeded'; break; }
          if (execRes.verdict === 'runtime_error') { finalVerdict = 'Runtime Error'; break; }
          
          const actualOutput = execRes.stdout || '';
          if (actualOutput.trim() !== tc.expectedOutput.trim()) {
            finalVerdict = 'Wrong Answer';
            break;
          }
        }

        // Apply Logic (Step 9 & 10)
        const timeTakenSeconds = Math.floor((Date.now() - battle.startedAt.getTime()) / 1000);
        participant.solvedProblems.push({
          problem: problem._id,
          verdict: finalVerdict,
          solvedAt: Date.now(),
          timeTaken: timeTakenSeconds
        });

        if (finalVerdict === 'Accepted') {
           const basePoints = { easy: 100, medium: 200, hard: 300 }[problem.difficulty] || 200;
           const timeDecayFactor = Math.max(0.5, 1 - 0.5 * (timeTakenSeconds / (battle.duration * 60)));
           
           // Calculate penalties for THIS problem
           const wrongAttempts = participant.solvedProblems.filter(sp => sp.problem.toString() === problemId && sp.verdict !== 'Accepted').length;
           const penaltyDeduction = wrongAttempts * 10;
           
           let finalProblemScore = Math.floor((basePoints * timeDecayFactor) - penaltyDeduction);
           finalProblemScore = Math.max(finalProblemScore, 10);
           
           participant.score += finalProblemScore;
           participant.lastAcceptedAt = Date.now();
        } else {
           participant.penalties += 1;
        }

        await battle.save();

        // Populate users for leaderboard
        await battle.populate('participants.user', 'name avatarUrl githubId');
        
        // Sort leaderboard
        const currentLeaderboard = battle.participants.sort((a, b) => {
           if (b.score !== a.score) return b.score - a.score;
           if (!a.lastAcceptedAt) return 1;
           if (!b.lastAcceptedAt) return -1;
           return a.lastAcceptedAt.getTime() - b.lastAcceptedAt.getTime();
        });

        io.to(roomCode).emit('battle:leaderboard_update', currentLeaderboard);

        // Check total victory (Step 12)
        const allFinished = battle.participants.every(p => {
           const acceptedCount = p.solvedProblems.filter(sp => sp.verdict === 'Accepted').length;
           return acceptedCount === battle.settings.questionCount;
        });

        if (allFinished) {
           battle.status = 'completed';
           battle.endedAt = Date.now();
           await battle.save();
           io.to(roomCode).emit('battle:ended', currentLeaderboard);
        }

      } catch (err) {
         console.error('Socket submission error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name} (${socket.id})`);
    });
  });
};
