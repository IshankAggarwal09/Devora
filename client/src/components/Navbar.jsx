import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';
import Wordmark from './Wordmark';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <nav className="bg-surface border-b border-hairline sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/">
              <Wordmark />
            </Link>
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link
                  to="/problems"
                  className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Practice
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
