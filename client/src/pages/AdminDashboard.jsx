import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProblems } from '../store/problemsSlice';

const DIFFICULTY_COLORS = {
  easy: 'bg-verdict-green/20 text-verdict-green',
  medium: 'bg-host-amber/20 text-host-amber',
  hard: 'bg-verdict-red/20 text-verdict-red',
};

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { list, isLoading, error } = useSelector((state) => state.problems);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    dispatch(fetchProblems({ difficulty: 'all', topics: [] }));
  }, [dispatch]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this problem?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/problems/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete problem');
      dispatch(fetchProblems({ difficulty: 'all', topics: [] }));
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-foreground p-6 sm:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-display">Admin Dashboard</h1>
            <p className="text-muted mt-2">Manage platform problems here.</p>
          </div>
          <Link
            to="/admin/new"
            className="bg-signal text-ink font-medium px-4 py-2 rounded-sm hover:opacity-90 transition-opacity"
          >
            + Create Problem
          </Link>
        </div>

        {(error || deleteError) && (
          <div className="bg-verdict-red/10 border border-verdict-red/20 p-4 rounded-sm">
            <p className="text-verdict-red text-sm">{error || deleteError}</p>
          </div>
        )}

        <div className="bg-surface border border-hairline rounded-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-muted">Loading...</div>
          ) : list.length === 0 ? (
            <div className="p-12 text-center text-muted">No problems found.</div>
          ) : (
            <ul className="divide-y divide-hairline">
              {list.map((problem) => (
                <li key={problem._id} className="p-4 flex items-center justify-between hover:bg-hairline/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{problem.title}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-sm uppercase tracking-wider ${
                        DIFFICULTY_COLORS[problem.difficulty]
                      }`}
                    >
                      {problem.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleDelete(problem._id)}
                      className="text-verdict-red text-sm font-medium hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
