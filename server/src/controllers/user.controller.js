import Submission from '../models/submission.model.js';
import Problem from '../models/problem.model.js';

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all accepted submissions for the user, sorted by newest first
    const acceptedSubmissions = await Submission.find({
      user: userId,
      verdict: 'Accepted',
    })
      .sort({ createdAt: -1 })
      .populate('problem', 'title difficulty slug')
      .lean();

    // 1. Calculate Recent Solves (Unique problems only)
    const recentSolves = [];
    const seenProblems = new Set();

    for (const sub of acceptedSubmissions) {
      if (sub.problem && !seenProblems.has(sub.problem._id.toString())) {
        seenProblems.add(sub.problem._id.toString());
        recentSolves.push({
          _id: sub.problem._id,
          title: sub.problem.title,
          difficulty: sub.problem.difficulty,
          slug: sub.problem.slug,
          solvedAt: sub.createdAt,
          language: sub.language,
          executionTime: sub.executionTime
        });
      }
    }

    // 2. Calculate Streak
    // Get unique dates (YYYY-MM-DD) the user had an accepted submission
    const activeDates = new Set();
    acceptedSubmissions.forEach(sub => {
      const date = new Date(sub.createdAt);
      // Format as YYYY-MM-DD in local time
      const dateString = date.toISOString().split('T')[0];
      activeDates.add(dateString);
    });

    const sortedActiveDates = Array.from(activeDates).sort((a, b) => new Date(b) - new Date(a));
    
    let currentStreak = 0;
    
    if (sortedActiveDates.length > 0) {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      // Check if streak is active (must have solved today or yesterday)
      if (sortedActiveDates[0] === todayString || sortedActiveDates[0] === yesterdayString) {
        currentStreak = 1;
        
        let expectedDate = new Date(sortedActiveDates[0]);
        for (let i = 1; i < sortedActiveDates.length; i++) {
          expectedDate.setDate(expectedDate.getDate() - 1);
          const expectedDateString = expectedDate.toISOString().split('T')[0];
          
          if (sortedActiveDates[i] === expectedDateString) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    res.status(200).json({
      streak: currentStreak,
      totalSolved: recentSolves.length,
      recentSolves: recentSolves,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Server error fetching dashboard stats' });
  }
};
