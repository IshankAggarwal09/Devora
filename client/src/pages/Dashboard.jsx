import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <div className="min-h-screen bg-ink text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center py-6 border-b border-hairline">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-surface hover:bg-surface/80 text-sm font-medium rounded-sm transition-colors border border-hairline"
          >
            Logout
          </button>
        </header>

        <main className="mt-8">
          <div className="bg-surface border border-hairline rounded-sm p-8 flex items-center gap-6">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-ink flex-shrink-0 border-2 border-signal">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-muted bg-ink">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              <p className="text-muted">{user?.email}</p>
              {user?.githubId && (
                <span className="inline-flex mt-2 items-center rounded-sm bg-surface px-2 py-1 text-xs font-medium text-muted ring-1 ring-inset ring-hairline">
                  GitHub Connected
                </span>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
