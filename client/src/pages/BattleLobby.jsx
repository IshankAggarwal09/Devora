import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Copy, Users, Settings, Clock, Check } from 'lucide-react';
import { fetchBattle } from '../store/battleSlice';
import useBattleSocket from '../hooks/useBattleSocket';
import BattleActive from '../components/BattleActive';
import BattleResults from '../components/BattleResults';

const BattleLobby = () => {
  const { roomCode } = useParams();
  const dispatch = useDispatch();
  
  const { currentBattle, isLoading, error: restError } = useSelector((state) => state.battle);
  const { user } = useSelector((state) => state.auth);

  const [socketError, setSocketError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fetch initial state via REST
  useEffect(() => {
    dispatch(fetchBattle(roomCode));
  }, [dispatch, roomCode]);

  // Connect socket
  const socket = useBattleSocket(roomCode, (err) => {
    setSocketError(typeof err === 'string' ? err : (err?.message || 'An error occurred.'));
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartBattle = () => {
    console.log('Start Battle clicked, socket:', socket);
    if (socket) {
      console.log('Emitting battle:start for roomCode:', roomCode);
      socket.emit('battle:start', roomCode);
    } else {
      console.log('Socket is null, cannot emit!');
    }
  };

  if (isLoading && !currentBattle) {
    return (
      <div className="min-h-screen bg-ink text-foreground flex items-center justify-center p-6">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-signal"></div>
          <span className="text-muted">Loading lobby...</span>
        </div>
      </div>
    );
  }

  if (restError) {
    return (
      <div className="min-h-screen bg-ink text-foreground flex flex-col items-center justify-center p-6 space-y-4">
        <h1 className="text-3xl font-display font-bold">Lobby Error</h1>
        <div className="bg-verdict-red/10 border border-verdict-red/20 text-verdict-red p-4 rounded-sm">
          {restError}
        </div>
      </div>
    );
  }

  if (!currentBattle) return null;

  const isHost = user && currentBattle && (
    currentBattle.host?._id === user._id || currentBattle.host === user._id
  );

  if (currentBattle.status === 'in_progress') {
    return <BattleActive socket={socket} />;
  }

  if (currentBattle.status === 'completed') {
    return <BattleResults />;
  }

  return (
    <div className="min-h-screen bg-ink text-foreground p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header / Room Code */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold font-display">Battle Lobby</h1>
            <p className="text-muted mt-2">Waiting for the host to start the battle...</p>
          </div>
          
          <div className="bg-surface border border-hairline rounded-sm p-4 flex items-center gap-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">Room Code</p>
              <p className="text-3xl font-utility font-bold tracking-widest text-signal">{roomCode}</p>
            </div>
            <button
              onClick={handleCopy}
              className="p-3 bg-ink hover:bg-hairline border border-hairline rounded-sm transition-colors"
              title="Copy Room Code"
            >
              {copied ? <Check className="w-5 h-5 text-verdict-green" /> : <Copy className="w-5 h-5 text-muted" />}
            </button>
          </div>
        </div>

        {/* Socket Errors */}
        {socketError && (
          <div className="bg-verdict-red/10 border border-verdict-red/20 p-4 rounded-sm flex justify-between items-center">
            <span className="text-verdict-red text-sm">{socketError}</span>
            <button onClick={() => setSocketError(null)} className="text-verdict-red hover:opacity-75">×</button>
          </div>
        )}

        {/* Rules & Scoring */}
        <div className="bg-surface border border-hairline rounded-sm p-6">
          <h2 className="font-display font-bold text-xl mb-4 text-signal">Rules & Scoring</h2>
          <ul className="list-disc list-inside space-y-2 text-muted text-sm">
            <li>Points are awarded based on difficulty: <strong>Easy: 100</strong>, <strong>Medium: 200</strong>, <strong>Hard: 300</strong>.</li>
            <li><strong>Time Decay:</strong> Points decrease up to 50% based on how long it takes you to solve relative to the total duration.</li>
            <li><strong>Penalties:</strong> Each wrong submission applies a fixed <strong>-10 point penalty</strong> on the problem's final score.</li>
            <li><strong>Win Condition:</strong> The player with the most points when time expires, or who finishes early with the most points, wins.</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Settings Summary */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-surface border border-hairline rounded-sm p-6 space-y-6">
              <div className="flex items-center gap-2 text-foreground font-display text-xl font-bold">
                <Settings className="w-5 h-5 text-signal" />
                <h2>Settings</h2>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-muted mb-1">Mode</p>
                  <p className="font-semibold capitalize">{currentBattle.settings.mode}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Difficulty</p>
                  <p className="font-semibold capitalize">{currentBattle.settings.difficulty}</p>
                </div>
                {currentBattle.settings.topics && currentBattle.settings.topics.length > 0 && (
                  <div>
                    <p className="text-muted mb-1">Topics</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentBattle.settings.topics.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-ink border border-hairline rounded-sm text-xs text-muted">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-muted mb-1">Questions</p>
                  <p className="font-semibold">{currentBattle.settings.questionCount}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Duration</p>
                  <p className="font-semibold">{currentBattle.duration} mins</p>
                </div>
              </div>
            </div>

            {/* Host Controls */}
            {isHost && (
              <div className="bg-surface border border-hairline rounded-sm p-6 space-y-4">
                <h3 className="font-semibold">Host Controls</h3>
                <button
                  onClick={handleStartBattle}
                  className="w-full bg-signal text-ink font-semibold py-3 rounded-sm transition-colors hover:bg-signal/90 flex items-center justify-center gap-2"
                >
                  <Clock className="w-5 h-5" />
                  Start Battle
                </button>
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="md:col-span-2 bg-surface border border-hairline rounded-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div className="flex items-center gap-2 text-foreground font-display text-xl font-bold">
                <Users className="w-5 h-5 text-signal" />
                <h2>Participants</h2>
              </div>
              <span className="bg-ink border border-hairline px-3 py-1 rounded-full text-xs font-semibold">
                {currentBattle.participants?.length || 0} Joined
              </span>
            </div>

            <ul className="space-y-3">
              {currentBattle.participants && currentBattle.participants.map((p) => (
                <li key={p.user?._id || p._id} className="flex items-center gap-3 p-3 bg-ink rounded-sm border border-hairline">
                  <div className="w-8 h-8 rounded-full bg-surface border border-hairline flex items-center justify-center font-bold text-signal">
                    {p.user?.name ? p.user.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="font-semibold">{p.user?.name || 'Unknown User'}</p>
                    {(p.user?._id === currentBattle.host?._id || p.user?._id === currentBattle.host) && (
                      <span className="text-[10px] uppercase tracking-wider text-host-amber font-bold">Host</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BattleLobby;
