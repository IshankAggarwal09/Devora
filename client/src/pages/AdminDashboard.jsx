import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import { adminFetchProblems, adminDeleteProblem, clearAdminError } from '../store/adminSlice';

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Easy',   cls: 'text-verdict-green bg-verdict-green/10 border-verdict-green/20' },
  medium: { label: 'Medium', cls: 'text-host-amber bg-host-amber/10 border-host-amber/20' },
  hard:   { label: 'Hard',   cls: 'text-verdict-red bg-verdict-red/10 border-verdict-red/20' },
};

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────

const DeleteModal = ({ problem, onConfirm, onCancel, isDeleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
    <div className="bg-surface border border-hairline rounded-sm w-full max-w-md p-6 shadow-2xl animate-in">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-verdict-red/10 flex items-center justify-center">
          <AlertTriangle size={18} className="text-verdict-red" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Delete Problem?</h3>
          <p className="text-sm text-muted mt-1.5">
            This will permanently remove <span className="text-foreground font-medium">"{problem.title}"</span> and
            all its test cases. This action cannot be undone.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-6 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-verdict-red text-white rounded-sm
            hover:bg-verdict-red/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {isDeleting && <Loader2 size={13} className="animate-spin" />}
          Delete Problem
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const AdminProblems = () => {
  const dispatch = useDispatch();
  const { problems, isLoading, error } = useSelector((state) => state.admin);

  const [deleteTarget, setDeleteTarget] = useState(null); // problem object
  const [isDeleting, setIsDeleting]     = useState(false);

  useEffect(() => {
    dispatch(adminFetchProblems());
    return () => { dispatch(clearAdminError()); };
  }, [dispatch]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await dispatch(adminDeleteProblem(deleteTarget._id));
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <>
      {deleteTarget && (
        <DeleteModal
          problem={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}

      <div className="min-h-screen bg-ink text-foreground">
        {/* Header */}
        <div className="border-b border-hairline bg-surface/50">
          <div className="max-w-6xl mx-auto px-6 py-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-signal/10 border border-signal/20 flex items-center justify-center">
                <ShieldCheck size={16} className="text-signal" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-display">Admin · Problems</h1>
                <p className="text-xs text-muted mt-0.5">
                  {problems.length} problem{problems.length !== 1 ? 's' : ''} on the platform
                </p>
              </div>
            </div>
            <Link
              to="/admin/problems/new"
              className="flex items-center gap-2 bg-signal text-ink text-sm font-bold px-4 py-2.5 rounded-sm
                hover:bg-signal/90 active:scale-[0.98] transition-all"
            >
              <Plus size={15} />
              New Problem
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8 space-y-4">
          {/* Error */}
          {error && (
            <div className="bg-verdict-red/10 border border-verdict-red/30 rounded-sm px-4 py-3 flex items-center gap-3">
              <AlertTriangle size={15} className="text-verdict-red flex-shrink-0" />
              <p className="text-verdict-red text-sm">{error}</p>
            </div>
          )}

          {/* Table */}
          <div className="bg-surface border border-hairline rounded-sm overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-hairline bg-ink/30">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted">Title</span>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted w-20 text-center">Difficulty</span>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted w-20 text-center">Test Cases</span>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted w-16 text-center">Topics</span>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted w-24 text-right">Actions</span>
            </div>

            {/* Rows */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-muted">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Loading problems…</span>
              </div>
            ) : problems.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-muted text-sm">No problems yet.</p>
                <Link to="/admin/problems/new" className="text-signal text-sm hover:underline mt-2 inline-block">
                  Create your first problem →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-hairline">
                {problems.map((problem) => {
                  const diff = DIFFICULTY_CONFIG[problem.difficulty] || DIFFICULTY_CONFIG.easy;
                  const sampleCount = problem.testCases?.filter((tc) => tc.isSample).length ?? 0;
                  const hiddenCount = problem.testCases?.filter((tc) => !tc.isSample).length ?? 0;

                  return (
                    <li
                      key={problem._id}
                      className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto] gap-2 md:gap-4 items-center
                        px-5 py-4 hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Title */}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{problem.title}</p>
                        <p className="text-xs text-muted mt-0.5 font-utility">{problem.slug}</p>
                      </div>

                      {/* Difficulty badge */}
                      <div className="md:w-20 md:text-center">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${diff.cls}`}>
                          {diff.label}
                        </span>
                      </div>

                      {/* Test cases count */}
                      <div className="md:w-20 md:text-center">
                        <span className="text-xs text-muted font-utility">
                          <span className="text-verdict-green">{sampleCount}s</span>
                          {' / '}
                          <span className="text-host-amber">{hiddenCount}h</span>
                        </span>
                      </div>

                      {/* Topics count */}
                      <div className="md:w-16 md:text-center">
                        <span className="text-xs text-muted">
                          {problem.topics?.length ?? 0} tag{(problem.topics?.length ?? 0) !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 md:w-24 md:justify-end">
                        <Link
                          to={`/admin/problems/${problem._id}/edit`}
                          className="flex items-center gap-1.5 text-xs text-muted hover:text-signal transition-colors
                            px-2.5 py-1.5 rounded border border-transparent hover:border-signal/30 hover:bg-signal/5"
                        >
                          <Pencil size={12} />
                          <span className="hidden sm:inline">Edit</span>
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(problem)}
                          className="flex items-center gap-1.5 text-xs text-muted hover:text-verdict-red transition-colors
                            px-2.5 py-1.5 rounded border border-transparent hover:border-verdict-red/30 hover:bg-verdict-red/5"
                        >
                          <Trash2 size={12} />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer hint */}
          {!isLoading && problems.length > 0 && (
            <p className="text-xs text-muted text-right">
              Showing {problems.length} problem{problems.length !== 1 ? 's' : ''}
              {' · '}
              <span className="text-verdict-green">s = sample</span>
              {' / '}
              <span className="text-host-amber">h = hidden</span>
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminProblems;
