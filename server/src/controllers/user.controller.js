import mongoose from 'mongoose';
import Submission from '../models/submission.model.js';
import Problem from '../models/problem.model.js';
import Battle from '../models/battle.model.js';

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Problems Solved Aggregation:
    //    Find unique accepted problems with solve date, difficulty breakdown
    // ─────────────────────────────────────────────────────────────────────────
    const [solvedAggregation, totalCatalogCounts] = await Promise.all([
      Submission.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            verdict: 'Accepted',
          },
        },
        // Sort ascending by time so the earliest accepted submission is preserved per problem
        {
          $sort: { createdAt: 1 },
        },
        // Group by problem to ensure deduplication
        {
          $group: {
            _id: '$problem',
            firstSolvedAt: { $first: '$createdAt' },
            latestSolvedAt: { $last: '$createdAt' },
            firstLanguage: { $first: '$language' },
            executionTime: { $first: '$executionTime' },
          },
        },
        // Join problem details (title, slug, difficulty)
        {
          $lookup: {
            from: 'problems',
            localField: '_id',
            foreignField: '_id',
            as: 'problem',
          },
        },
        {
          $unwind: '$problem',
        },
        // Project clean fields
        {
          $project: {
            _id: '$problem._id',
            title: '$problem.title',
            slug: '$problem.slug',
            difficulty: '$problem.difficulty',
            solvedAt: '$latestSolvedAt',
            language: '$firstLanguage',
            executionTime: '$executionTime',
          },
        },
        // Sort most recently solved first
        {
          $sort: { solvedAt: -1 },
        },
      ]),

      // Count total problems in database per difficulty for context
      Problem.aggregate([
        {
          $group: {
            _id: '$difficulty',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Format total problems in catalog
    const catalogCounts = { easy: 0, medium: 0, hard: 0, total: 0 };
    totalCatalogCounts.forEach((c) => {
      if (c._id && catalogCounts[c._id] !== undefined) {
        catalogCounts[c._id] = c.count;
      }
      catalogCounts.total += c.count;
    });

    // Breakdown user's solved problems
    const solvedCounts = { easy: 0, medium: 0, hard: 0, total: solvedAggregation.length };
    solvedAggregation.forEach((p) => {
      if (p.difficulty && solvedCounts[p.difficulty] !== undefined) {
        solvedCounts[p.difficulty] += 1;
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Consecutive Day Streak Calculation
    //    Consecutive calendar days (UTC/ISO date) with at least one AC
    // ─────────────────────────────────────────────────────────────────────────
    const acceptedDates = await Submission.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          verdict: 'Accepted',
        },
      },
      {
        $project: {
          dateString: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
        },
      },
      {
        $group: {
          _id: '$dateString',
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    const activeDates = acceptedDates.map((d) => d._id);
    let currentStreak = 0;

    if (activeDates.length > 0) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (activeDates[0] === todayStr || activeDates[0] === yesterdayStr) {
        currentStreak = 1;
        let expectedDate = new Date(activeDates[0]);

        for (let i = 1; i < activeDates.length; i++) {
          expectedDate.setDate(expectedDate.getDate() - 1);
          const expectedStr = expectedDate.toISOString().split('T')[0];

          if (activeDates[i] === expectedStr) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Battle History & Ranking Aggregation
    //    Look up completed/in_progress battles participant took part in
    // ─────────────────────────────────────────────────────────────────────────
    const battleHistoryRaw = await Battle.find({
      'participants.user': userId,
    })
      .sort({ createdAt: -1 })
      .select('roomCode status duration startedAt endedAt createdAt participants settings questions')
      .lean();

    const userObjIdStr = userId.toString();
    let battlesParticipated = 0;
    let battlesWon = 0;

    const battleHistory = battleHistoryRaw.map((battle) => {
      battlesParticipated++;

      // Sort participants according to battle ranking rules (score DESC, lastAcceptedAt ASC)
      const rankedParticipants = [...(battle.participants || [])].sort((a, b) => {
        if ((b.score || 0) !== (a.score || 0)) {
          return (b.score || 0) - (a.score || 0);
        }
        if (!a.lastAcceptedAt) return 1;
        if (!b.lastAcceptedAt) return -1;
        return new Date(a.lastAcceptedAt).getTime() - new Date(b.lastAcceptedAt).getTime();
      });

      const participantCount = rankedParticipants.length;
      const userIndex = rankedParticipants.findIndex(
        (p) => (p.user?._id || p.user)?.toString() === userObjIdStr
      );

      const rank = userIndex !== -1 ? userIndex + 1 : participantCount;
      if (rank === 1 && battle.status === 'completed') {
        battlesWon++;
      }

      const userRecord = userIndex !== -1 ? rankedParticipants[userIndex] : null;
      const problemsSolvedCount = (userRecord?.solvedProblems || []).filter(
        (sp) => sp.verdict === 'Accepted'
      ).length;

      return {
        _id: battle._id,
        roomCode: battle.roomCode,
        status: battle.status,
        date: battle.endedAt || battle.startedAt || battle.createdAt,
        totalParticipants: participantCount,
        rank,
        score: userRecord?.score || 0,
        problemsSolved: problemsSolvedCount,
        totalQuestions: battle.questions?.length || battle.settings?.questionCount || 0,
        hasFinished: userRecord?.hasFinished || false,
      };
    });

    res.status(200).json({
      streak: currentStreak,
      totalSolved: solvedCounts.total,
      breakdown: {
        easy: { solved: solvedCounts.easy, total: catalogCounts.easy },
        medium: { solved: solvedCounts.medium, total: catalogCounts.medium },
        hard: { solved: solvedCounts.hard, total: catalogCounts.hard },
      },
      solvedProblems: solvedAggregation,
      recentSolves: solvedAggregation.slice(0, 10), // Backwards compatible with existing widget
      battles: {
        participated: battlesParticipated,
        won: battlesWon,
        history: battleHistory,
      },
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ error: 'Server error fetching user dashboard stats' });
  }
};
