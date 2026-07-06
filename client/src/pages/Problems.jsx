import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { fetchProblems, setFilters } from '../store/problemsSlice';

const DIFFICULTY_COLORS = {
  easy: 'bg-verdict-green/20 text-verdict-green',
  medium: 'bg-host-amber/20 text-host-amber',
  hard: 'bg-verdict-red/20 text-verdict-red',
};

const TOPICS_LIST = [
  'Arrays', 'Strings', 'Hash Table', 'Math', 'Dynamic Programming', 'Sorting', 'Greedy', 'Depth-First Search', 'Database'
];

const Problems = () => {
  const dispatch = useDispatch();
  const { list, filters, isLoading, error } = useSelector((state) => state.problems);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchProblems(filters));
  }, [dispatch, filters]);

  const handleDifficultyChange = (e) => {
    dispatch(setFilters({ difficulty: e.target.value }));
  };

  const handleTopicToggle = (topic) => {
    const currentTopics = [...filters.topics];
    if (currentTopics.includes(topic)) {
      dispatch(setFilters({ topics: currentTopics.filter((t) => t !== topic) }));
    } else {
      dispatch(setFilters({ topics: [...currentTopics, topic] }));
    }
  };

  const isSolved = (problemId) => {
    return user?.solvedProblems?.includes(problemId);
  };

  return (
    <div className="min-h-screen bg-ink text-foreground p-6 sm:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Practice</h1>
          <p className="text-muted mt-2">Solve challenges to improve your skills.</p>
        </div>

        {/* Filters */}
        <div className="bg-surface border border-hairline p-4 rounded-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="difficulty" className="text-sm font-medium text-muted">Difficulty</label>
              <select
                id="difficulty"
                value={filters.difficulty}
                onChange={handleDifficultyChange}
                className="bg-ink border border-hairline rounded-sm py-2 px-3 text-sm focus:outline-none focus:border-signal"
              >
                <option value="all">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2 flex-grow">
              <label className="text-sm font-medium text-muted">Topics</label>
              <div className="flex flex-wrap gap-2">
                {TOPICS_LIST.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleTopicToggle(topic)}
                    className={`px-3 py-1 text-xs rounded-sm border transition-colors ${
                      filters.topics.includes(topic)
                        ? 'bg-signal text-ink border-signal'
                        : 'bg-ink text-muted border-hairline hover:border-signal'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-verdict-red/10 border border-verdict-red/20 p-4 rounded-sm">
            <p className="text-verdict-red text-sm">{error}</p>
          </div>
        )}

        {/* Problem List */}
        <div className="bg-surface border border-hairline rounded-sm overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-hairline">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 bg-hairline rounded-full"></div>
                    <div className="w-48 h-5 bg-hairline rounded-sm"></div>
                  </div>
                  <div className="w-16 h-6 bg-hairline rounded-sm"></div>
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="p-12 text-center text-muted">
              <p>No problems match these filters.</p>
            </div>
          ) : (
            <ul className="divide-y divide-hairline">
              {list.map((problem) => (
                <li key={problem._id}>
                  <Link
                    to={`/problems/${problem.slug}`}
                    className="block p-4 hover:bg-hairline/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {isSolved(problem._id) ? (
                          <CheckCircle2 className="w-5 h-5 text-verdict-green" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-hairline"></div>
                        )}
                        <span className="font-medium">{problem.title}</span>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-sm uppercase tracking-wider ${
                          DIFFICULTY_COLORS[problem.difficulty]
                        }`}
                      >
                        {problem.difficulty}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Problems;
