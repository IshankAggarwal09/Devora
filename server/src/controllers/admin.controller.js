import Problem from '../models/problem.model.js';

/**
 * GET /api/admin/problems
 * Returns all problems INCLUDING hidden test cases (full data for admin use).
 */
export const adminGetProblems = async (req, res) => {
  try {
    const problems = await Problem.find({})
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');
    res.status(200).json(problems);
  } catch (error) {
    console.error('Admin: Error fetching problems:', error);
    res.status(500).json({ error: 'Server error fetching problems' });
  }
};

/**
 * GET /api/admin/problems/:id
 * Returns a single problem by ID with ALL test cases (sample + hidden).
 */
export const adminGetProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id).populate('createdBy', 'name email');
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    res.status(200).json(problem);
  } catch (error) {
    console.error('Admin: Error fetching problem by id:', error);
    res.status(500).json({ error: 'Server error fetching problem' });
  }
};
