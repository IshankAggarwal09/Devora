import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { logoutUser } from '../store/authSlice';
import {
  Flame,
  CheckCircle2,
  Swords,
  Trophy,
  Calendar,
  ExternalLink,
  Code2,
  Clock,
  ChevronRight,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const DIFFICULTY_STYLES = {
  easy: {
    badge: 'text-verdict-green bg-verdict-green/10 border border-verdict-green/30',
    bar: 'bg-verdict-green',
    text: 'text-verdict-green',
    label: 'Easy',
  },
  medium: {
    badge: 'text-host-amber bg-host-amber/10 border border-host-amber/30',
    bar: 'bg-host-amber',
    text: 'text-host-amber',
    label: 'Medium',
  },
  hard: {
    badge: 'text-verdict-red bg-verdict-red/10 border border-verdict-red/30',
    bar: 'bg-verdict-red',
    text: 'text-verdict-red',
    label: 'Hard',
  },
};

const formatOrdinal = (n) => {
  const pr = new Intl.PluralRules('en', { type: 'ordinal' });
  const suffixes = { one: 'st', two: 'nd', few: 'rd', other: 'th' };
  return `${n}${suffixes[pr.select(n)] || 'th'}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const timeAgo = (dateString) => {
  if (!dateString) return '—';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHr / 24);

  if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return `Yesterday`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(dateString);
};

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [stats, setStats] = useState({
    streak: 0,
    totalSolved: 0,
    breakdown: {
      easy: { solved: 0, total: 0 },
      medium: { solved: 0, total: 0 },
      hard: { solved: 0, total: 0 },
    },
    solvedProblems: [],
    battles: {
      participated: 0,
      won: 0,
      history: [],
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, easy, medium, hard
  const [searchFilter, setSearchFilter] = useState('');

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/users/me/stats`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load user statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Error fetching profile data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  // Filter solved problems list by difficulty pill and search input
  const filteredSolvedProblems = useMemo(() => {
    return (stats.solvedProblems || []).filter((p) => {
      const matchesTab = activeTab === 'all' || p.difficulty === activeTab;
      const matchesSearch =
        !searchFilter.trim() ||
        p.title?.toLowerCase().includes(searchFilter.toLowerCase().trim());
      return matchesTab && matchesSearch;
    });
  }, [stats.solvedProblems, activeTab, searchFilter]);

  // Difficulty percentages for horizontal stacked progress bar
  const progressBars = useMemo(() => {
    const total = stats.totalSolved || 0;
    if (total === 0) return { easy: 0, medium: 0, hard: 0 };
    return {
      easy: ((stats.breakdown?.easy?.solved || 0) / total) * 100,
      medium: ((stats.breakdown?.medium?.solved || 0) / total) * 100,
      hard: ((stats.breakdown?.hard?.solved || 0) / total) * 100,
    };
  }, [stats.totalSolved, stats.breakdown]);

  return (
    <div className="min-h-screen bg-ink text-foreground p-4 sm:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ─── Header: User Profile Banner ─── */}
        <header className="bg-surface border border-hairline rounded-sm p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-sm overflow-hidden bg-ink border-2 border-signal/60 shrink-0 flex items-center justify-center shadow-inner">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-2xl font-bold font-display text-signal bg-ink">
                  {user?.name?.charAt(0).toUpperCase() || 'D'}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
                  {user?.name || 'Developer'}
                </h1>
                {user?.isAdmin && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-signal/15 text-signal border border-signal/30">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted font-utility">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={fetchStats}
              title="Refresh statistics"
              className="p-2.5 bg-ink hover:bg-hairline text-muted hover:text-foreground border border-hairline rounded-sm transition-colors text-xs flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin text-signal' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-ink hover:bg-hairline text-xs font-semibold text-muted hover:text-foreground rounded-sm border border-hairline transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-verdict-red/10 border border-verdict-red/25 p-4 rounded-sm text-verdict-red text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="hover:opacity-75">✕</button>
          </div>
        )}

        {/* ─── Row 1: Key Metrics Stat Cards ─── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Solved */}
          <div className="bg-surface border border-hairline rounded-sm p-5 space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs font-semibold uppercase tracking-wider font-utility">Problems Solved</span>
              <CheckCircle2 className="w-5 h-5 text-verdict-green" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold font-display text-foreground">
              {isLoading ? '—' : stats.totalSolved}
            </div>
            <p className="text-[11px] text-muted flex items-center gap-1">
              <span>Across Easy, Medium & Hard</span>
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-verdict-green opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Card 2: Battles Participated */}
          <div className="bg-surface border border-hairline rounded-sm p-5 space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs font-semibold uppercase tracking-wider font-utility">Battles Fought</span>
              <Swords className="w-5 h-5 text-signal" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold font-display text-foreground">
              {isLoading ? '—' : stats.battles?.participated ?? 0}
            </div>
            <p className="text-[11px] text-muted">Real-time room multiplayer</p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-signal opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Card 3: Battles Won */}
          <div className="bg-surface border border-hairline rounded-sm p-5 space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs font-semibold uppercase tracking-wider font-utility">Victories (1st)</span>
              <Trophy className="w-5 h-5 text-host-amber" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold font-display text-foreground">
              {isLoading ? '—' : stats.battles?.won ?? 0}
            </div>
            <p className="text-[11px] text-muted">
              {stats.battles?.participated > 0
                ? `${Math.round(((stats.battles.won || 0) / stats.battles.participated) * 100)}% Win Rate`
                : 'No battles yet'}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-host-amber opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Card 4: Daily Streak */}
          <div className="bg-surface border border-hairline rounded-sm p-5 space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs font-semibold uppercase tracking-wider font-utility">Active Streak</span>
              <Flame className="w-5 h-5 text-host-amber animate-pulse" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold font-display text-foreground flex items-baseline gap-1.5">
              <span>{isLoading ? '—' : stats.streak}</span>
              <span className="text-xs font-normal text-muted font-utility">days</span>
            </div>
            <p className="text-[11px] text-muted">Consecutive days with AC</p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-host-amber opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
        </section>

        {/* ─── Row 2: Main Two-Column Layout ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── Left Column (7 cols): Problems Solved & Scrollable List ── */}
          <section className="lg:col-span-7 space-y-6">
            <div className="bg-surface border border-hairline rounded-sm overflow-hidden flex flex-col">
              
              {/* Section Header with Difficulty Breakdown */}
              <div className="p-6 border-b border-hairline space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-verdict-green" />
                    <h2 className="text-lg font-bold font-display">Problems Solved</h2>
                  </div>
                  <span className="text-xs font-utility px-2.5 py-1 bg-ink border border-hairline rounded-full text-muted">
                    {stats.totalSolved} Completed
                  </span>
                </div>

                {/* Horizontal Segmented Progress Bar */}
                <div className="space-y-2">
                  <div className="h-3 w-full bg-ink rounded-full overflow-hidden flex border border-hairline/60">
                    {progressBars.easy > 0 && (
                      <div
                        style={{ width: `${progressBars.easy}%` }}
                        className="bg-verdict-green transition-all duration-500 hover:opacity-90"
                        title={`Easy: ${stats.breakdown?.easy?.solved || 0}`}
                      />
                    )}
                    {progressBars.medium > 0 && (
                      <div
                        style={{ width: `${progressBars.medium}%` }}
                        className="bg-host-amber transition-all duration-500 hover:opacity-90"
                        title={`Medium: ${stats.breakdown?.medium?.solved || 0}`}
                      />
                    )}
                    {progressBars.hard > 0 && (
                      <div
                        style={{ width: `${progressBars.hard}%` }}
                        className="bg-verdict-red transition-all duration-500 hover:opacity-90"
                        title={`Hard: ${stats.breakdown?.hard?.solved || 0}`}
                      />
                    )}
                  </div>

                  {/* Difficulty Breakdown Badges */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {['easy', 'medium', 'hard'].map((diff) => {
                      const item = stats.breakdown?.[diff] || { solved: 0, total: 0 };
                      const style = DIFFICULTY_STYLES[diff];
                      return (
                        <div
                          key={diff}
                          className="bg-ink border border-hairline/60 rounded-sm p-3 text-center space-y-1"
                        >
                          <span className={`text-[10px] font-bold uppercase tracking-wider block ${style.text}`}>
                            {style.label}
                          </span>
                          <div className="text-lg font-bold font-display text-foreground">
                            {item.solved}
                            {item.total > 0 && (
                              <span className="text-xs font-normal text-muted font-utility ml-1">
                                /{item.total}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {['all', 'easy', 'medium', 'hard'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`text-xs px-3 py-1.5 rounded-sm font-utility capitalize transition-colors ${
                          activeTab === t
                            ? 'bg-signal text-ink font-semibold'
                            : 'bg-ink border border-hairline text-muted hover:text-foreground'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Search solved problems..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="bg-ink border border-hairline rounded-sm px-3 py-1.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-signal font-utility"
                  />
                </div>
              </div>

              {/* Scrollable Solved Problems List */}
              <div className="max-h-[500px] overflow-y-auto divide-y divide-hairline">
                {isLoading ? (
                  <div className="p-12 text-center text-muted font-utility text-sm">
                    Loading solved problems...
                  </div>
                ) : filteredSolvedProblems.length === 0 ? (
                  <div className="p-12 text-center text-muted space-y-3">
                    <Code2 className="w-8 h-8 text-muted mx-auto opacity-50" />
                    <p className="text-sm">
                      {searchFilter ? 'No matching problems found.' : 'No accepted problems yet.'}
                    </p>
                    <Link
                      to="/problems"
                      className="inline-flex items-center gap-1 text-xs text-signal hover:underline"
                    >
                      Start practicing <ArrowUpRight size={13} />
                    </Link>
                  </div>
                ) : (
                  filteredSolvedProblems.map((p) => {
                    const diffStyle = DIFFICULTY_STYLES[p.difficulty] || DIFFICULTY_STYLES.easy;
                    return (
                      <div
                        key={p._id}
                        className="p-4 hover:bg-hairline/30 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <Link
                            to={`/problems/${p.slug}`}
                            className="font-semibold text-sm text-foreground hover:text-signal transition-colors truncate block flex items-center gap-1.5 group"
                          >
                            <span className="truncate">{p.title}</span>
                            <ArrowUpRight
                              size={13}
                              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-signal"
                            />
                          </Link>
                          <div className="flex items-center gap-3 text-[11px] text-muted font-utility">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {formatDate(p.solvedAt)}
                            </span>
                            {p.language && (
                              <span className="uppercase tracking-wider">
                                • {p.language}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm shrink-0 font-utility ${diffStyle.badge}`}>
                          {diffStyle.label}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          {/* ── Right Column (5 cols): Battle History Section ── */}
          <section className="lg:col-span-5 space-y-6">
            <div className="bg-surface border border-hairline rounded-sm overflow-hidden flex flex-col">
              
              <div className="p-6 border-b border-hairline flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Swords className="w-5 h-5 text-signal" />
                  <h2 className="text-lg font-bold font-display">Battle History</h2>
                </div>
                <Link
                  to="/battles/join"
                  className="text-xs text-signal hover:underline inline-flex items-center gap-1 font-utility"
                >
                  Join Battle <ChevronRight size={12} />
                </Link>
              </div>

              {/* Scrollable Battle History List */}
              <div className="max-h-[600px] overflow-y-auto divide-y divide-hairline">
                {isLoading ? (
                  <div className="p-12 text-center text-muted font-utility text-sm">
                    Loading battle records...
                  </div>
                ) : (stats.battles?.history || []).length === 0 ? (
                  <div className="p-12 text-center text-muted space-y-3">
                    <Swords className="w-8 h-8 text-muted mx-auto opacity-50" />
                    <p className="text-sm">No battle participation history found.</p>
                    <div className="flex justify-center gap-3 pt-1">
                      <Link
                        to="/battles/create"
                        className="text-xs bg-signal text-ink px-3 py-1.5 rounded-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        Host a Battle
                      </Link>
                      <Link
                        to="/battles/join"
                        className="text-xs bg-ink border border-hairline text-foreground px-3 py-1.5 rounded-sm font-semibold hover:bg-hairline transition-colors"
                      >
                        Join Room
                      </Link>
                    </div>
                  </div>
                ) : (
                  stats.battles.history.map((b) => {
                    const isWinner = b.rank === 1 && b.status === 'completed';
                    return (
                      <div
                        key={b._id}
                        className="p-5 hover:bg-hairline/30 transition-colors space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-utility font-bold text-sm tracking-wider text-signal">
                              #{b.roomCode}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm font-utility ${
                                b.status === 'completed'
                                  ? 'bg-hairline text-muted'
                                  : 'bg-host-amber/15 text-host-amber border border-host-amber/30'
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>

                          <span className="text-xs text-muted font-utility">
                            {timeAgo(b.date)}
                          </span>
                        </div>

                        {/* Rank & Stats Row */}
                        <div className="grid grid-cols-3 gap-2 bg-ink border border-hairline/50 rounded-sm p-3 text-center font-utility">
                          <div>
                            <span className="text-[10px] text-muted uppercase block">Rank</span>
                            <span
                              className={`text-sm font-bold flex items-center justify-center gap-1 ${
                                isWinner ? 'text-host-amber' : 'text-foreground'
                              }`}
                            >
                              {isWinner && <Trophy size={13} className="shrink-0" />}
                              {formatOrdinal(b.rank)} / {b.totalParticipants}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-muted uppercase block">Score</span>
                            <span className="text-sm font-bold text-foreground">
                              {b.score} pts
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-muted uppercase block">Solved</span>
                            <span className="text-sm font-bold text-verdict-green">
                              {b.problemsSolved}
                              {b.totalQuestions > 0 ? ` / ${b.totalQuestions}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <Link
                            to={`/battles/${b.roomCode}`}
                            className="text-xs text-muted hover:text-signal transition-colors inline-flex items-center gap-1 font-utility"
                          >
                            View Room <ExternalLink size={11} />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
