import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { logoutUser } from '../store/authSlice';
import { Flame, CheckCircle2, Clock } from 'lucide-react';

const DIFFICULTY_COLORS = {
  easy: 'bg-verdict-green/20 text-verdict-green',
  medium: 'bg-host-amber/20 text-host-amber',
  hard: 'bg-verdict-red/20 text-verdict-red',
};

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [stats, setStats] = useState({
    streak: 0,
    totalSolved: 0,
    recentSolves: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users/dashboard', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHr = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHr / 24);

    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHr < 24) return `${diffHr} hours ago`;
    if (diffDays === 1) return `1 day ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-ink text-foreground p-6 sm:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-surface border-2 border-signal">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xl font-bold text-muted bg-surface">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display">{user?.name}</h1>
              <p className="text-muted">{user?.email}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-surface hover:bg-surface/80 text-sm font-medium rounded-sm transition-colors border border-hairline"
          >
            Logout
          </button>
        </header>

        {error && (
          <div className="bg-verdict-red/10 border border-verdict-red/20 p-4 rounded-sm text-verdict-red text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-surface border border-hairline rounded-sm p-6 flex flex-col items-center justify-center space-y-2">
              <div className="flex items-center gap-2 text-host-amber">
                <Flame size={32} />
                <span className="text-5xl font-bold font-display">{isLoading ? '-' : stats.streak}</span>
              </div>
              <p className="text-muted font-medium uppercase tracking-wider text-sm">Day Streak</p>
            </div>

            <div className="bg-surface border border-hairline rounded-sm p-6 flex flex-col items-center justify-center space-y-2">
              <div className="flex items-center gap-2 text-verdict-green">
                <CheckCircle2 size={32} />
                <span className="text-5xl font-bold font-display">{isLoading ? '-' : stats.totalSolved}</span>
              </div>
              <p className="text-muted font-medium uppercase tracking-wider text-sm">Problems Solved</p>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-surface border border-hairline rounded-sm overflow-hidden h-full flex flex-col">
              <div className="p-4 border-b border-hairline flex items-center gap-2 bg-surface">
                <Clock size={18} className="text-signal" />
                <h3 className="font-semibold text-lg">Recent Submissions</h3>
              </div>
              
              <div className="flex-grow overflow-y-auto" style={{ maxHeight: '500px' }}>
                {isLoading ? (
                  <div className="p-12 text-center text-muted">Loading...</div>
                ) : stats.recentSolves.length === 0 ? (
                  <div className="p-12 text-center text-muted">
                    <p>No accepted submissions yet.</p>
                    <Link to="/practice" className="text-signal hover:underline mt-2 inline-block">
                      Start solving!
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-hairline">
                    {stats.recentSolves.map((solve) => (
                      <li key={solve._id} className="p-4 hover:bg-hairline/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <Link 
                            to={`/problems/${solve.slug}`} 
                            className="font-medium hover:text-signal transition-colors"
                          >
                            {solve.title}
                          </Link>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-sm uppercase tracking-wider ${DIFFICULTY_COLORS[solve.difficulty]}`}>
                            {solve.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-muted">
                          <span>{timeAgo(solve.solvedAt)}</span>
                          <span className="uppercase tracking-wider">
                            {solve.language} • {solve.executionTime}ms
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
