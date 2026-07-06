import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { loginUser, clearError } from '../store/authSlice';
import Wordmark from '../components/Wordmark';
import VerdictLog from '../components/VerdictLog';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
    if (user) {
      navigate('/dashboard');
    }
  }, [dispatch, user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="min-h-screen flex bg-ink">
      {/* Left Panel - Form (60%) */}
      <div className="w-full lg:w-[60%] flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 relative z-10">
        <div className="max-w-sm w-full mx-auto space-y-10">
          <div>
            <Wordmark />
            <h2 className="mt-8 text-2xl font-bold tracking-tight text-foreground">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-muted">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-signal hover:underline">
                Create one
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-verdict-red/10 border border-verdict-red/20 rounded-sm p-3">
                <p className="text-sm text-verdict-red">{error}</p>
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-foreground mb-1">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-sm border border-hairline bg-surface py-2 px-3 text-foreground placeholder:text-muted focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal sm:text-sm transition-colors"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-sm border border-hairline bg-surface py-2 px-3 text-foreground placeholder:text-muted focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal sm:text-sm transition-colors"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center rounded-sm bg-signal px-4 py-2.5 text-sm font-medium text-ink hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-signal focus:ring-offset-2 focus:ring-offset-ink transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-ink" />
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-hairline" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-ink px-4 text-muted">Or continue with</span>
            </div>
          </div>

          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/github`}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-sm bg-surface border border-hairline px-4 py-2.5 text-sm font-medium text-foreground hover:bg-hairline transition-colors focus:outline-none focus:ring-2 focus:ring-signal focus:ring-offset-2 focus:ring-offset-ink"
          >
            <svg className="h-5 w-5 fill-current" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            GitHub
          </a>
        </div>
      </div>

      {/* Right Panel - Visual Signature (40%) */}
      <div className="hidden lg:block lg:w-[40%] bg-surface border-l border-hairline relative">
        <VerdictLog />
      </div>
    </div>
  );
};

export default Login;
