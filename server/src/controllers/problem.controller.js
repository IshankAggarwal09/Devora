import Problem from '../models/problem.model.js';
import Submission from '../models/submission.model.js';
import User from '../models/user.model.js';

export const createProblem = async (req, res) => {
  try {
    const { title, description, difficulty, topics, constraints, timeLimit, memoryLimit, testCases } = req.body;

    const problem = await Problem.create({
      title,
      description,
      difficulty,
      topics,
      constraints,
      timeLimit,
      memoryLimit,
      testCases,
      createdBy: req.user._id,
    });

    res.status(201).json(problem);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
      return res.status(400).json({ error: 'Problem with this auto-generated slug already exists' });
    }
    console.error('Error creating problem:', error);
    res.status(500).json({ error: 'Server error creating problem' });
  }
};

export const updateProblem = async (req, res) => {
  try {
    const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.status(200).json(problem);
  } catch (error) {
    console.error('Error updating problem:', error);
    res.status(500).json({ error: 'Server error updating problem' });
  }
};

export const deleteProblem = async (req, res) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.status(200).json({ message: 'Problem deleted successfully' });
  } catch (error) {
    console.error('Error deleting problem:', error);
    res.status(500).json({ error: 'Server error deleting problem' });
  }
};

export const getProblems = async (req, res) => {
  try {
    const query = {};
    if (req.query.difficulty) {
      query.difficulty = req.query.difficulty;
    }
    if (req.query.topics) {
      query.topics = { $in: req.query.topics.split(',') };
    }

    const problems = await Problem.find(query).select('-testCases');
    res.status(200).json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Server error fetching problems' });
  }
};

export const getProblemBySlug = async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug }).lean();

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    problem.testCases = problem.testCases.filter((tc) => tc.isSample);
    res.status(200).json(problem);
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({ error: 'Server error fetching problem' });
  }
};

export const submitProblem = async (req, res) => {
  try {
    const { language, code } = req.body;
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    if (!['cpp', 'java'].includes(language)) {
      return res.status(400).json({ error: 'Unsupported language' });
    }
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const EXEC_URL = process.env.EXECUTION_ENGINE_URL || 'http://localhost:5001';
    
    let totalExecutionTime = 0;
    let finalVerdict = 'Accepted';
    let failedTestCaseIndex = -1;
    let finalStderr = null;
    const testCaseResults = [];

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
        console.error('Execution Engine Error:', err);
        return res.status(500).json({ error: 'Execution engine unreachable' });
      }

      totalExecutionTime += execRes.executionTime;

      if (execRes.verdict === 'system_error') {
        finalVerdict = 'System Error';
        failedTestCaseIndex = i;
        finalStderr = execRes.stderr || 'Internal execution engine failure';
        testCaseResults.push({ passed: false, executionTime: execRes.executionTime, error: finalStderr });
        break;
      }

      if (execRes.verdict === 'compile_error') {
        finalVerdict = 'Compile Error';
        failedTestCaseIndex = i;
        finalStderr = execRes.stderr;
        testCaseResults.push({ passed: false, executionTime: execRes.executionTime, error: execRes.stderr });
        break;
      }
      
      if (execRes.verdict === 'timeout') {
        finalVerdict = 'Time Limit Exceeded';
        failedTestCaseIndex = i;
        testCaseResults.push({ passed: false, executionTime: execRes.executionTime, error: null });
        break;
      }

      if (execRes.verdict === 'runtime_error') {
        finalVerdict = 'Runtime Error';
        failedTestCaseIndex = i;
        finalStderr = execRes.stderr;
        testCaseResults.push({ passed: false, executionTime: execRes.executionTime, error: execRes.stderr });
        break;
      }

      const actualOutput = execRes.stdout || '';
      if (actualOutput.trim() !== tc.expectedOutput.trim()) {
        finalVerdict = 'Wrong Answer';
        failedTestCaseIndex = i;
        testCaseResults.push({ passed: false, executionTime: execRes.executionTime, error: null });
        break;
      }

      testCaseResults.push({ passed: true, executionTime: execRes.executionTime, error: null });
    }

    const submission = await Submission.create({
      user: req.user._id,
      problem: problem._id,
      language,
      code,
      verdict: finalVerdict,
      executionTime: totalExecutionTime,
      testCaseResults
    });

    if (finalVerdict === 'Accepted') {
      try {
        await User.findByIdAndUpdate(
          req.user._id,
          { $addToSet: { solvedProblems: problem._id } }
        );
      } catch (userUpdateErr) {
        console.error('Non-fatal error: Failed to update user solvedProblems list', userUpdateErr);
      }
    }

    res.status(201).json({
      verdict: finalVerdict,
      executionTime: totalExecutionTime,
      totalTestCases: problem.testCases.length,
      passedTestCases: finalVerdict === 'Accepted' ? problem.testCases.length : failedTestCaseIndex,
      failedTestCaseIndex: failedTestCaseIndex !== -1 ? failedTestCaseIndex : null,
      stderr: finalStderr
    });

  } catch (error) {
    console.error('Submit problem error:', error);
    res.status(500).json({ error: 'Server error processing submission' });
  }
};
