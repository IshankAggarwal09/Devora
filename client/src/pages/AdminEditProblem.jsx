import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Pencil, Loader2, AlertTriangle } from 'lucide-react';
import { adminFetchProblemById, clearCurrentProblem } from '../store/adminSlice';
import ProblemForm from '../components/ProblemForm';

const AdminEditProblem = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProblem, isLoading, error } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(adminFetchProblemById(id));
    return () => { dispatch(clearCurrentProblem()); };
  }, [id, dispatch]);

  return (
    <div className="min-h-screen bg-ink text-foreground">
      {/* Page Header */}
      <div className="border-b border-hairline bg-surface/50">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-4">
          <Link
            to="/admin/problems"
            className="text-muted hover:text-foreground transition-colors p-1.5 rounded hover:bg-white/5"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-host-amber/10 border border-host-amber/20 flex items-center justify-center">
              <Pencil size={13} className="text-host-amber" />
            </div>
            <div>
              <h1 className="font-bold font-display">
                {currentProblem ? currentProblem.title : 'Edit Problem'}
              </h1>
              <p className="text-xs text-muted">Admin · Edit Problem</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-muted">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Loading problem…</span>
          </div>
        ) : error && !currentProblem ? (
          <div className="bg-verdict-red/10 border border-verdict-red/30 rounded-sm px-4 py-4 flex items-center gap-3">
            <AlertTriangle size={15} className="text-verdict-red flex-shrink-0" />
            <p className="text-verdict-red text-sm">{error}</p>
          </div>
        ) : currentProblem ? (
          <ProblemForm mode="edit" initialData={currentProblem} />
        ) : null}
      </div>
    </div>
  );
};

export default AdminEditProblem;
