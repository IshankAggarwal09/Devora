import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createBattle } from '../store/battleSlice';

const TOPICS_LIST = [
  'Arrays', 'Strings', 'Hash Table', 'Math', 'Dynamic Programming', 'Sorting', 'Greedy', 'Depth-First Search', 'Database'
];

const MINIMUM_DURATION_MAP = {
  easy: 10,
  medium: 20,
  hard: 35,
  mixed: 20, // baseline for preview
};

const CreateBattle = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.battle);

  const [mode, setMode] = useState('mixed');
  const [difficulty, setDifficulty] = useState('mixed');
  const [topics, setTopics] = useState([]);
  const [questionCount, setQuestionCount] = useState(2);
  const [duration, setDuration] = useState(40);

  const minimumDuration = useMemo(() => {
    return MINIMUM_DURATION_MAP[difficulty] * questionCount;
  }, [difficulty, questionCount]);

  const handleTopicToggle = (topic) => {
    setTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (duration < minimumDuration) return;

    const payload = {
      settings: {
        mode,
        difficulty,
        questionCount,
        topics: mode === 'topic' ? topics : [],
      },
      duration
    };

    const action = await dispatch(createBattle(payload));
    if (createBattle.fulfilled.match(action)) {
      navigate(`/battles/${action.payload.roomCode}`);
    }
  };

  const isSubmitDisabled = duration < minimumDuration || isLoading || (mode === 'topic' && topics.length === 0);

  return (
    <div className="min-h-screen bg-ink text-foreground p-6 flex flex-col items-center justify-center">
      <div className="bg-surface border border-hairline rounded-sm p-8 max-w-lg w-full space-y-6 shadow-xl">
        <h1 className="text-3xl font-bold font-display text-center">Create a Battle</h1>
        
        {error && (
          <div className="bg-verdict-red/10 border border-verdict-red/20 p-4 rounded-sm text-verdict-red text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full bg-ink border border-hairline rounded-sm p-2 text-sm focus:outline-none focus:border-signal"
            >
              <option value="mixed">Mixed</option>
              <option value="topic">Topic-Specific</option>
              <option value="random">Random</option>
            </select>
          </div>

          {mode === 'topic' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Select Topics</label>
              <div className="flex flex-wrap gap-2">
                {TOPICS_LIST.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleTopicToggle(topic)}
                    className={`px-3 py-1 text-xs rounded-sm border transition-colors ${
                      topics.includes(topic)
                        ? 'bg-signal text-ink border-signal'
                        : 'bg-ink text-muted border-hairline hover:border-signal'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-ink border border-hairline rounded-sm p-2 text-sm focus:outline-none focus:border-signal"
            >
              <option value="mixed">Mixed</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">Number of Questions (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full bg-ink border border-hairline rounded-sm p-2 text-sm focus:outline-none focus:border-signal"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted flex justify-between">
              <span>Duration (Minutes)</span>
              <span className={`text-xs ${duration < minimumDuration ? 'text-verdict-red' : 'text-muted'}`}>
                Minimum required: {minimumDuration} mins
              </span>
            </label>
            <input
              type="number"
              min={minimumDuration}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={`w-full bg-ink border rounded-sm p-2 text-sm focus:outline-none ${
                duration < minimumDuration ? 'border-verdict-red' : 'border-hairline focus:border-signal'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full bg-signal text-ink font-semibold py-2 rounded-sm transition-colors hover:bg-signal/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Battle'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateBattle;
