import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { adminCreateProblem, adminUpdateProblem, clearAdminError } from '../store/adminSlice';

// ─── Constants ────────────────────────────────────────────────────────────────

const TOPICS_LIST = [
  'Arrays', 'Strings', 'Hash Table', 'Math', 'Dynamic Programming',
  'Sorting', 'Greedy', 'Depth-First Search', 'Breadth-First Search',
  'Binary Search', 'Two Pointers', 'Sliding Window', 'Stack', 'Queue',
  'Linked List', 'Trees', 'Graphs', 'Heap', 'Trie', 'Backtracking',
  'Bit Manipulation', 'Recursion', 'Divide and Conquer', 'Database',
];

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Easy',   cls: 'text-verdict-green border-verdict-green/50 bg-verdict-green/10' },
  medium: { label: 'Medium', cls: 'text-host-amber border-host-amber/50 bg-host-amber/10' },
  hard:   { label: 'Hard',   cls: 'text-verdict-red border-verdict-red/50 bg-verdict-red/10' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const FormLabel = ({ children, required }) => (
  <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-2">
    {children}
    {required && <span className="text-verdict-red ml-1">*</span>}
  </label>
);

const Input = (props) => (
  <input
    {...props}
    className={`w-full bg-ink border border-hairline rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted/50
      focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal/30 transition-all ${props.className || ''}`}
  />
);

const Textarea = (props) => (
  <textarea
    {...props}
    className={`w-full bg-ink border border-hairline rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted/50
      focus:outline-none focus:border-signal focus:ring-1 focus:ring-signal/30 transition-all font-utility resize-y ${props.className || ''}`}
  />
);

// ─── Test Case Block ──────────────────────────────────────────────────────────

const TestCaseBlock = ({ tc, index, onRemove, onChange, groupLabel }) => (
  <div className="bg-ink border border-hairline rounded-sm overflow-hidden">
    <div className="flex items-center justify-between px-4 py-2.5 bg-surface/60 border-b border-hairline">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold font-utility text-muted">
          {groupLabel} #{index + 1}
        </span>
        {tc.isSample ? (
          <span className="flex items-center gap-1 text-xs text-verdict-green bg-verdict-green/10 px-2 py-0.5 rounded-full border border-verdict-green/20">
            <Eye size={10} /> Visible
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted bg-hairline/60 px-2 py-0.5 rounded-full border border-hairline">
            <EyeOff size={10} /> Hidden
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-muted hover:text-verdict-red transition-colors p-1 rounded"
        title="Remove test case"
      >
        <Trash2 size={14} />
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <div>
        <FormLabel>Input</FormLabel>
        <Textarea
          value={tc.input}
          onChange={(e) => onChange(index, 'input', e.target.value)}
          rows={3}
          placeholder="stdin input..."
        />
      </div>
      <div>
        <FormLabel>Expected Output</FormLabel>
        <Textarea
          value={tc.expectedOutput}
          onChange={(e) => onChange(index, 'expectedOutput', e.target.value)}
          rows={3}
          placeholder="expected stdout..."
        />
      </div>
    </div>
  </div>
);

// ─── Section Card ─────────────────────────────────────────────────────────────

const Section = ({ title, description, action, children }) => (
  <div className="bg-surface border border-hairline rounded-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-hairline flex items-start justify-between gap-4">
      <div>
        <h2 className="font-semibold text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * @param {object}  props
 * @param {'create'|'edit'} props.mode
 * @param {object}  [props.initialData]  — pre-populated when mode === 'edit'
 */
const ProblemForm = ({ mode = 'create', initialData }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isSaving, error } = useSelector((state) => state.admin);

  // ── Form state ──────────────────────────────────────────────────────────────

  const [fields, setFields] = useState({
    title: '',
    difficulty: 'easy',
    topics: [],
    description: '',
    constraints: [''],
    timeLimit: 2000,
    memoryLimit: 256,
  });

  const [sampleCases, setSampleCases] = useState([{ input: '', expectedOutput: '' }]);
  const [hiddenCases, setHiddenCases] = useState([{ input: '', expectedOutput: '' }]);
  const [topicsOpen, setTopicsOpen] = useState(false);

  // ── Seed from initialData when editing ─────────────────────────────────────

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFields({
        title: initialData.title || '',
        difficulty: initialData.difficulty || 'easy',
        topics: initialData.topics || [],
        description: initialData.description || '',
        constraints: initialData.constraints?.length ? initialData.constraints : [''],
        timeLimit: initialData.timeLimit ?? 2000,
        memoryLimit: initialData.memoryLimit ?? 256,
      });
      const sample = initialData.testCases?.filter((tc) => tc.isSample) || [];
      const hidden = initialData.testCases?.filter((tc) => !tc.isSample) || [];
      setSampleCases(sample.length ? sample.map(({ input, expectedOutput }) => ({ input, expectedOutput })) : [{ input: '', expectedOutput: '' }]);
      setHiddenCases(hidden.length ? hidden.map(({ input, expectedOutput }) => ({ input, expectedOutput })) : [{ input: '', expectedOutput: '' }]);
    }
  }, [mode, initialData]);

  useEffect(() => {
    return () => { dispatch(clearAdminError()); };
  }, [dispatch]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const setField = (key, value) => setFields((f) => ({ ...f, [key]: value }));

  const toggleTopic = (topic) =>
    setField('topics', fields.topics.includes(topic)
      ? fields.topics.filter((t) => t !== topic)
      : [...fields.topics, topic]);

  // constraints
  const updateConstraint = (i, v) => {
    const c = [...fields.constraints]; c[i] = v; setField('constraints', c);
  };
  const addConstraint = () => setField('constraints', [...fields.constraints, '']);
  const removeConstraint = (i) => setField('constraints', fields.constraints.filter((_, idx) => idx !== i));

  // test cases factory
  const makeTCHandlers = (setter) => ({
    onChange: (i, key, val) => setter((prev) => { const n = [...prev]; n[i] = { ...n[i], [key]: val }; return n; }),
    onAdd: () => setter((prev) => [...prev, { input: '', expectedOutput: '' }]),
    onRemove: (i) => setter((prev) => prev.filter((_, idx) => idx !== i)),
  });
  const sampleHandlers = makeTCHandlers(setSampleCases);
  const hiddenHandlers = makeTCHandlers(setHiddenCases);

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();

    const testCases = [
      ...sampleCases.filter((tc) => tc.input.trim() && tc.expectedOutput.trim()).map((tc) => ({ ...tc, isSample: true })),
      ...hiddenCases.filter((tc) => tc.input.trim() && tc.expectedOutput.trim()).map((tc) => ({ ...tc, isSample: false })),
    ];

    const payload = {
      title: fields.title,
      difficulty: fields.difficulty,
      topics: fields.topics,
      description: fields.description,
      constraints: fields.constraints.filter((c) => c.trim()),
      timeLimit: Number(fields.timeLimit),
      memoryLimit: Number(fields.memoryLimit),
      testCases,
    };

    let result;
    if (mode === 'edit') {
      result = await dispatch(adminUpdateProblem({ id: initialData._id, payload }));
    } else {
      result = await dispatch(adminCreateProblem(payload));
    }

    if (!result.error) {
      navigate('/admin/problems');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Error Banner */}
      {error && (
        <div className="bg-verdict-red/10 border border-verdict-red/30 rounded-sm px-4 py-3 flex items-start gap-3">
          <span className="text-verdict-red text-lg leading-none mt-0.5">⚠</span>
          <p className="text-verdict-red text-sm">{error}</p>
        </div>
      )}

      {/* ── Metadata ── */}
      <Section title="Problem Details" description="Title, difficulty, and topic tags">
        <div className="space-y-5">

          {/* Title */}
          <div>
            <FormLabel required>Title</FormLabel>
            <Input
              type="text"
              value={fields.title}
              onChange={(e) => setField('title', e.target.value)}
              required
              placeholder="e.g. Two Sum"
            />
          </div>

          {/* Difficulty + Time + Memory */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FormLabel required>Difficulty</FormLabel>
              <div className="flex gap-2">
                {Object.entries(DIFFICULTY_CONFIG).map(([val, { label, cls }]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setField('difficulty', val)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-sm border transition-all ${
                      fields.difficulty === val ? cls : 'border-hairline text-muted bg-ink hover:border-signal/40'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FormLabel>Time Limit (ms)</FormLabel>
              <Input
                type="number"
                value={fields.timeLimit}
                onChange={(e) => setField('timeLimit', e.target.value)}
                min={100}
                max={10000}
              />
            </div>
            <div>
              <FormLabel>Memory Limit (MB)</FormLabel>
              <Input
                type="number"
                value={fields.memoryLimit}
                onChange={(e) => setField('memoryLimit', e.target.value)}
                min={16}
                max={512}
              />
            </div>
          </div>

          {/* Topics multi-select */}
          <div>
            <FormLabel>Topic Tags</FormLabel>
            <div className="relative">
              <button
                type="button"
                onClick={() => setTopicsOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 py-2 bg-ink border border-hairline rounded-sm text-sm text-left hover:border-signal/50 focus:outline-none focus:border-signal transition-all"
              >
                <span className={fields.topics.length ? 'text-foreground' : 'text-muted/60'}>
                  {fields.topics.length ? `${fields.topics.length} tag${fields.topics.length > 1 ? 's' : ''} selected` : 'Select topics…'}
                </span>
                <ChevronDown size={14} className={`text-muted transition-transform ${topicsOpen ? 'rotate-180' : ''}`} />
              </button>

              {topicsOpen && (
                <div className="absolute z-20 mt-1 w-full bg-surface border border-hairline rounded-sm shadow-xl p-3">
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {TOPICS_LIST.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                          fields.topics.includes(topic)
                            ? 'bg-signal text-ink border-signal font-semibold'
                            : 'bg-ink text-muted border-hairline hover:border-signal/60 hover:text-foreground'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selected tags preview */}
            {fields.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {fields.topics.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 text-xs bg-signal/10 text-signal border border-signal/30 px-2 py-0.5 rounded-full"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => toggleTopic(t)}
                      className="hover:text-verdict-red transition-colors leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ── Description ── */}
      <Section title="Description" description="Supports Markdown — wrap code in backticks, use ## for headings">
        <Textarea
          value={fields.description}
          onChange={(e) => setField('description', e.target.value)}
          rows={12}
          required
          placeholder="## Problem Statement&#10;&#10;Given an array `nums`…"
        />
      </Section>

      {/* ── Constraints ── */}
      <Section
        title="Constraints"
        action={
          <button type="button" onClick={addConstraint} className="flex items-center gap-1.5 text-xs text-signal hover:opacity-80 transition-opacity font-medium">
            <Plus size={13} /> Add
          </button>
        }
      >
        {fields.constraints.length === 0 ? (
          <p className="text-sm text-muted">No constraints added.</p>
        ) : (
          <div className="space-y-2">
            {fields.constraints.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={c}
                  onChange={(e) => updateConstraint(i, e.target.value)}
                  placeholder="e.g. 1 ≤ n ≤ 10⁵"
                />
                <button
                  type="button"
                  onClick={() => removeConstraint(i)}
                  className="text-muted hover:text-verdict-red transition-colors p-2 flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Sample Test Cases ── */}
      <Section
        title="Sample Test Cases"
        description="Visible to users in the problem statement"
        action={
          <button type="button" onClick={sampleHandlers.onAdd} className="flex items-center gap-1.5 text-xs text-verdict-green hover:opacity-80 transition-opacity font-medium">
            <Plus size={13} /> Add Sample
          </button>
        }
      >
        {sampleCases.length === 0 ? (
          <p className="text-sm text-muted">No sample test cases. Users won't see any examples.</p>
        ) : (
          <div className="space-y-3">
            {sampleCases.map((tc, i) => (
              <TestCaseBlock
                key={i}
                tc={{ ...tc, isSample: true }}
                index={i}
                groupLabel="Sample"
                onChange={sampleHandlers.onChange}
                onRemove={() => sampleHandlers.onRemove(i)}
              />
            ))}
          </div>
        )}
      </Section>

      {/* ── Hidden Test Cases ── */}
      <Section
        title="Hidden Test Cases"
        description="Used for judging — not shown to users"
        action={
          <button type="button" onClick={hiddenHandlers.onAdd} className="flex items-center gap-1.5 text-xs text-host-amber hover:opacity-80 transition-opacity font-medium">
            <Plus size={13} /> Add Hidden
          </button>
        }
      >
        {hiddenCases.length === 0 ? (
          <p className="text-sm text-muted">No hidden test cases.</p>
        ) : (
          <div className="space-y-3">
            {hiddenCases.map((tc, i) => (
              <TestCaseBlock
                key={i}
                tc={{ ...tc, isSample: false }}
                index={i}
                groupLabel="Hidden"
                onChange={hiddenHandlers.onChange}
                onRemove={() => hiddenHandlers.onRemove(i)}
              />
            ))}
          </div>
        )}
      </Section>

      {/* ── Submit ── */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 sm:flex-none sm:min-w-48 bg-signal text-ink font-bold py-3 px-8 rounded-sm hover:bg-signal/90
            disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          {isSaving ? (mode === 'edit' ? 'Saving…' : 'Creating…') : (mode === 'edit' ? 'Save Changes' : 'Create Problem')}
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/problems')}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProblemForm;
