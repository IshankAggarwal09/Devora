import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus } from 'lucide-react';

const TOPICS_LIST = [
  'Arrays', 'Strings', 'Hash Table', 'Math', 'Dynamic Programming', 'Sorting', 'Greedy', 'Depth-First Search', 'Database'
];

const AdminCreateProblem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    difficulty: 'easy',
    topics: [],
    description: '',
    timeLimit: 1000,
    memoryLimit: 256,
  });

  const [constraints, setConstraints] = useState(['']);
  const [testCases, setTestCases] = useState([
    { input: '', expectedOutput: '', isSample: true }
  ]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTopicToggle = (topic) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter((t) => t !== topic)
        : [...prev.topics, topic]
    }));
  };

  const handleConstraintChange = (index, value) => {
    const newConstraints = [...constraints];
    newConstraints[index] = value;
    setConstraints(newConstraints);
  };

  const addConstraint = () => setConstraints([...constraints, '']);
  
  const removeConstraint = (index) => {
    setConstraints(constraints.filter((_, i) => i !== index));
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...testCases];
    newTestCases[index][field] = value;
    setTestCases(newTestCases);
  };

  const addTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '', isSample: false }]);
  };

  const removeTestCase = (index) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        constraints: constraints.filter(c => c.trim() !== ''),
        testCases: testCases.filter(tc => tc.input.trim() !== '' && tc.expectedOutput.trim() !== ''),
      };

      const response = await fetch('http://localhost:5000/api/problems', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create problem');
      }

      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-foreground p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Create Problem</h1>
          <p className="text-muted mt-2">Add a new problem to the platform.</p>
        </div>

        {error && (
          <div className="bg-verdict-red/10 border border-verdict-red/20 p-4 rounded-sm">
            <p className="text-verdict-red text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-surface border border-hairline rounded-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full bg-ink border border-hairline rounded-sm p-2 text-sm focus:outline-none focus:border-signal"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Difficulty</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className="w-full bg-ink border border-hairline rounded-sm p-2 text-sm focus:outline-none focus:border-signal"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Time Limit (ms)</label>
              <input
                type="number"
                name="timeLimit"
                value={formData.timeLimit}
                onChange={handleInputChange}
                className="w-full bg-ink border border-hairline rounded-sm p-2 text-sm focus:outline-none focus:border-signal"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted">Topics</label>
              <div className="flex flex-wrap gap-2">
                {TOPICS_LIST.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleTopicToggle(topic)}
                    className={`px-3 py-1 text-xs rounded-sm border transition-colors ${
                      formData.topics.includes(topic)
                        ? 'bg-signal text-ink border-signal'
                        : 'bg-ink text-muted border-hairline hover:border-signal'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted">Description (Markdown)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="8"
                className="w-full bg-ink border border-hairline rounded-sm p-2 text-sm font-utility focus:outline-none focus:border-signal"
              />
            </div>
          </div>

          <div className="border-t border-hairline pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Constraints</h3>
              <button type="button" onClick={addConstraint} className="text-sm text-signal hover:underline flex items-center gap-1">
                <Plus size={16} /> Add Constraint
              </button>
            </div>
            <div className="space-y-3">
              {constraints.map((constraint, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={constraint}
                    onChange={(e) => handleConstraintChange(index, e.target.value)}
                    className="flex-grow bg-ink border border-hairline rounded-sm p-2 text-sm focus:outline-none focus:border-signal"
                    placeholder="e.g. 1 <= nums.length <= 10^4"
                  />
                  <button type="button" onClick={() => removeConstraint(index)} className="text-verdict-red p-2 hover:bg-verdict-red/10 rounded-sm">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-hairline pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Test Cases</h3>
              <button type="button" onClick={addTestCase} className="text-sm text-signal hover:underline flex items-center gap-1">
                <Plus size={16} /> Add Test Case
              </button>
            </div>
            <div className="space-y-6">
              {testCases.map((tc, index) => (
                <div key={index} className="bg-ink border border-hairline p-4 rounded-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Test Case #{index + 1}</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-muted">
                        <input
                          type="checkbox"
                          checked={tc.isSample}
                          onChange={(e) => handleTestCaseChange(index, 'isSample', e.target.checked)}
                          className="rounded-sm bg-surface border-hairline"
                        />
                        Is Sample (Visible)
                      </label>
                      <button type="button" onClick={() => removeTestCase(index)} className="text-verdict-red hover:underline text-sm">
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-muted">Input</label>
                      <textarea
                        value={tc.input}
                        onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                        rows="3"
                        className="w-full bg-surface border border-hairline rounded-sm p-2 text-sm font-utility focus:outline-none focus:border-signal"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted">Expected Output</label>
                      <textarea
                        value={tc.expectedOutput}
                        onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                        rows="3"
                        className="w-full bg-surface border border-hairline rounded-sm p-2 text-sm font-utility focus:outline-none focus:border-signal"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-hairline pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-signal text-ink font-semibold py-3 rounded-sm hover:bg-signal/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Problem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateProblem;
