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
      origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:5173'],
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

    // --- Helper: handleRejoin ---
    const handleRejoin = async (data = {}, callback) => {
      const roomCode = typeof data === 'string' ? data : data?.roomCode;
      const explicitUserId = data?.userId || data?.user?._id || data?.user?.id;
      const effectiveUserId = (socket.user?._id || explicitUserId)?.toString();

      console.log(`[socket] rejoin-battle requested by ${socket.user?.name || effectiveUserId} for room ${roomCode}`);

      try {
        if (!roomCode) {
          const err = 'Room code is required to rejoin';
          if (callback) callback({ error: err });
          return socket.emit('battle:error', err);
        }

        const battle = await Battle.findOne({ roomCode })
          .populate('participants.user', 'name avatarUrl githubId')
          .populate('questions');

        if (!battle) {
          const err = 'Battle not found';
          if (callback) callback({ error: err });
          return socket.emit('battle:error', err);
        }

        // Validate that user is a registered participant
        const participant = battle.participants.find((p) => {
          const pUid = p.user?._id ? p.user._id.toString() : p.user?.toString();
          return pUid === effectiveUserId;
        });

        if (!participant) {
          console.log(`[socket] User ${effectiveUserId} is not a participant in ${roomCode}`);
          const err = 'Not a registered participant in this battle';
          if (callback) callback({ error: err });
          return socket.emit('battle:error', err);
        }

        // Re-add to the Socket.IO room
        socket.join(roomCode);
        console.log(`[socket] User ${socket.user?.name || effectiveUserId} successfully rejoined room ${roomCode}`);

        // Compute server-authoritative timer metrics
        const serverTime = Date.now();
        let timeElapsed = 0;
        let timeRemaining = 0;

        if (battle.startedAt && battle.duration) {
          timeElapsed = Math.max(0, Math.floor((serverTime - new Date(battle.startedAt).getTime()) / 1000));
          const totalDurationSec = battle.duration * 60;
          timeRemaining = Math.max(0, totalDurationSec - timeElapsed);

          // Check if time expired while disconnected
          if (battle.status === 'in_progress' && timeRemaining <= 0) {
            battle.status = 'completed';
            battle.endedAt = Date.now();
            await battle.save();
          }
        }

        // Safe problem broadcast (strip hidden test cases so solutions aren't leaked)
        const safeQuestions = (battle.questions || []).map((q) => {
          const doc = q.toObject ? q.toObject() : { ...q };
          if (doc.testCases) {
            doc.testCases = doc.testCases.filter((tc) => tc.isSample === true);
          }
          return doc;
        });

        // Current leaderboard sorted by score (desc) then lastAcceptedAt (asc)
        const sortedLeaderboard = [...battle.participants].sort((a, b) => {
          if (b.score !== a.score) return (b.score || 0) - (a.score || 0);
          if (!a.lastAcceptedAt) return 1;
          if (!b.lastAcceptedAt) return -1;
          return new Date(a.lastAcceptedAt).getTime() - new Date(b.lastAcceptedAt).getTime();
        });

        const battleState = {
          roomCode: battle.roomCode,
          status: battle.status,
          startedAt: battle.startedAt,
          duration: battle.duration,
          serverTime,
          timeElapsed,
          timeRemaining,
          questions: safeQuestions,
          leaderboard: sortedLeaderboard,
          participants: battle.participants,
          userSubmissions: participant.solvedProblems || [],
          myScore: participant.score || 0,
          myPenalties: participant.penalties || 0,
          hasFinished: participant.hasFinished || false,
          host: battle.host,
        };

        if (callback) {
          callback({ success: true, battleState });
        }

        // Emit back full battle state to rejoining client
        socket.emit('rejoin-battle:success', battleState);
        socket.emit('battle:rejoined', battleState);

        // Notify room members
        socket.to(roomCode).emit('battle:participant_reconnected', {
          userId: effectiveUserId,
          name: socket.user?.name || participant.user?.name || 'A participant',
        });
      } catch (err) {
        console.error('Socket rejoin error:', err);
        if (callback) callback({ error: 'Server error while rejoining battle' });
      }
    };

    // Listen for rejoin-battle events
    socket.on('rejoin-battle', handleRejoin);
    socket.on('battle:rejoin', handleRejoin);

    // --- battle:join ---
    socket.on('battle:join', async (roomCode) => {
      console.log(`[socket] battle:join called by ${socket.user.name} for room ${roomCode}`);
      try {
        const battle = await Battle.findOne({ roomCode })
          .populate('participants.user', 'name avatarUrl githubId')
          .populate('questions');

        if (!battle) {
          return socket.emit('battle:error', 'Battle not found');
        }

        // Verify they are in the participants array (REST should have done this)
        const isParticipant = battle.participants.some(
          (p) => p.user?._id?.toString() === socket.user._id.toString() || p.user?.toString() === socket.user._id.toString()
        );
        if (!isParticipant) {
          console.log(`[socket] User ${socket.user.name} is not a participant in ${roomCode}`);
          return socket.emit('battle:error', 'Not a participant in this battle');
        }

        // If the battle is already in progress or completed, route to rejoin flow to send full state
        if (battle.status === 'in_progress' || battle.status === 'completed') {
          return handleRejoin({ roomCode, userId: socket.user._id });
        }

        socket.join(roomCode);
        console.log(`[socket] User ${socket.user.name} successfully joined socket room ${roomCode}`);

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
          console.log(`[socket] User ${socket.user.name} tried to start battle but is not host.`);
          return socket.emit('battle:error', 'Only the host can start the battle');
        }
        
        console.log(`[socket] Host ${socket.user.name} starting battle ${roomCode}`);

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

        // Safe problem broadcast (strip hidden testCases)
        const safeProblems = selectedProblems.map(p => {
           const safe = { ...p };
           if (safe.testCases) {
             safe.testCases = safe.testCases.filter(tc => tc.isSample === true);
           }
           return safe;
        });

        io.to(roomCode).emit('battle:started', {
          startedAt: battle.startedAt,
          duration: battle.duration,
          questions: safeProblems
        });
        
        console.log(`[socket] battle:started emitted to room ${roomCode}`);

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

    // --- battle:finish_early ---
    socket.on('battle:finish_early', async (roomCode) => {
      try {
        const battle = await Battle.findOne({ roomCode, status: 'in_progress' }).populate('participants.user');
        if (!battle) return;

        const participant = battle.participants.find(p => p.user._id.toString() === socket.user._id.toString());
        if (participant && !participant.hasFinished) {
          participant.hasFinished = true;
          await battle.save();
          
          const allFinished = battle.participants.every(p => p.hasFinished);
          if (allFinished) {
            battle.status = 'completed';
            battle.endedAt = Date.now();
            await battle.save();

            const finalLeaderboard = battle.participants.sort((a, b) => {
              if (b.score !== a.score) return (b.score || 0) - (a.score || 0);
              if (!a.lastAcceptedAt) return 1;
              if (!b.lastAcceptedAt) return -1;
              return a.lastAcceptedAt.getTime() - b.lastAcceptedAt.getTime();
            });

            io.to(roomCode).emit('battle:ended', finalLeaderboard);
          } else {
            io.to(roomCode).emit('battle:leaderboard_update', battle.participants);
          }
        }
      } catch (err) {
        console.error('finish_early error:', err);
      }
    });

    // --- battle:submission ---
    socket.on('battle:submission', async ({ roomCode, problemId, language, code }, callback) => {
      try {
        const battle = await Battle.findOne({ roomCode, status: 'in_progress' });
        if (!battle) {
          if (callback) callback({ error: 'Battle is not in progress' });
          return;
        }

        // Verify time hasn't naturally expired before the interval caught it
        const timeElapsed = Date.now() - battle.startedAt.getTime();
        if (timeElapsed >= battle.duration * 60 * 1000) {
           if (callback) callback({ error: 'Battle time has expired' });
           return;
        }

        const participantIndex = battle.participants.findIndex(p => p.user.toString() === socket.user._id.toString());
        if (participantIndex === -1) {
          if (callback) callback({ error: 'Not a participant' });
          return;
        }
        const participant = battle.participants[participantIndex];

        if (participant.hasFinished) {
          if (callback) callback({ error: 'You have already finished the battle.' });
          return;
        }

        // Check if already solved
        const alreadySolved = participant.solvedProblems.some(sp => sp.problem.toString() === problemId && sp.verdict === 'Accepted');
        if (alreadySolved) {
           if (callback) callback({ error: 'Problem already solved' });
           return;
        }

        const problem = await Problem.findById(problemId);
        if (!problem) {
          if (callback) callback({ error: 'Problem not found' });
          return;
        }

        let finalVerdict = 'Accepted';
        let finalError = null;
        let failedIndex = 0;
        
        for (let i = 0; i < problem.testCases.length; i++) {
          const tc = problem.testCases[i];
          let execRes;
          try {
            const execUrl = process.env.EXECUTION_ENGINE_URL || 'http://localhost:5001';
            const response = await fetch(`${execUrl}/execute`, {
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
             finalError = err.message;
             break;
          }

          if (execRes.verdict === 'system_error') { finalVerdict = 'System Error'; finalError = execRes.error; break; }
          if (execRes.verdict === 'compile_error') { finalVerdict = 'Compile Error'; finalError = execRes.stderr; break; }
          if (execRes.verdict === 'timeout') { finalVerdict = 'Time Limit Exceeded'; failedIndex = i; break; }
          if (execRes.verdict === 'runtime_error') { finalVerdict = 'Runtime Error'; finalError = execRes.stderr; break; }
          
          const actualOutput = execRes.stdout || '';
          if (actualOutput.trim() !== tc.expectedOutput.trim()) {
            finalVerdict = 'Wrong Answer';
            failedIndex = i;
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
        } else if (finalVerdict !== 'System Error') {
           participant.penalties += 1;
        }

        await battle.save();

        // Send callback to user
        if (callback) {
          callback({
            verdict: finalVerdict,
            totalTestCases: problem.testCases.length,
            failedTestCaseIndex: failedIndex,
            stderr: finalError,
            error: finalVerdict === 'System Error' ? finalError : null
          });
        }

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
         if (callback) callback({ error: 'Server error during submission' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name} (${socket.id})`);
    });
  });
};
