import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { logoutUser } from '../store/authSlice';
import Wordmark from './Wordmark';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const { currentBattle } = useSelector((state) => state.battle);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (currentBattle?.status === 'in_progress' && !location.pathname.startsWith(`/battles/${currentBattle.roomCode}`)) {
      navigate(`/battles/${currentBattle.roomCode}`);
    }
  }, [currentBattle?.status, currentBattle?.roomCode, location.pathname, navigate]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <nav className="bg-surface border-b border-hairline sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            {currentBattle?.status === 'in_progress' ? (
              <Wordmark />
            ) : (
              <Link to="/">
                <Wordmark />
              </Link>
            )}
          </div>

          <div className="flex items-center gap-6">
            {currentBattle?.status === 'in_progress' ? (
              <div className="text-verdict-red font-bold font-utility animate-pulse">
                Battle in Progress
              </div>
            ) : user ? (
              <>
                <Link
                  to="/problems"
                  className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Practice
                </Link>
                <Link
                  to="/battles/create"
                  className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Create Battle
                </Link>
                <Link
                  to="/battles/join"
                  className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Join Battle
                </Link>
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-4 border-l border-hairline pl-6">
                  <div className="h-8 w-8 rounded-sm bg-ink border border-hairline flex items-center justify-center overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-utility text-xs text-muted">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-medium bg-signal text-ink px-4 py-2 rounded-sm hover:opacity-90 transition-opacity"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
