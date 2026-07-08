import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, CheckCircle2, ArrowRight } from 'lucide-react';

const BattleResults = () => {
  const { currentBattle, leaderboard } = useSelector((state) => state.battle);
  const navigate = useNavigate();

  // If we just refreshed and don't have leaderboard yet, use participants
  let participants = leaderboard?.length > 0 ? leaderboard : currentBattle?.participants || [];
  
  // Sort just to be sure
  const sortedParticipants = [...participants].sort((a, b) => {
    if (b.score !== a.score) {
      return (b.score || 0) - (a.score || 0);
    }
    const aTime = a.lastScoreUpdate ? new Date(a.lastScoreUpdate).getTime() : 0;
    const bTime = b.lastScoreUpdate ? new Date(b.lastScoreUpdate).getTime() : 0;
    return aTime - bTime;
  });

  const questions = currentBattle?.questions || [];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-ink flex flex-col items-center py-12 px-4">
      <div className="max-w-4xl w-full space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-host-amber/10 rounded-full mb-4">
            <Trophy className="w-12 h-12 text-host-amber" />
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground">Battle Complete!</h1>
          <p className="text-muted text-lg">
            Room <span className="font-utility font-bold text-foreground">{currentBattle?.roomCode}</span> has concluded.
          </p>
        </div>

        {/* Top 3 Podium */}
        {sortedParticipants.length > 0 && (
          <div className="flex justify-center items-end gap-4 mt-8 mb-12">
            {/* 2nd Place */}
            {sortedParticipants.length > 1 && (
              <div className="flex flex-col items-center w-1/3 max-w-[160px]">
                <div className="h-16 w-16 rounded-sm bg-surface border-2 border-[#C0C0C0] overflow-hidden mb-3">
                  {sortedParticipants[1].user?.avatarUrl ? (
                    <img src={sortedParticipants[1].user.avatarUrl} alt="2nd" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold bg-[#C0C0C0]/20 text-[#C0C0C0]">
                      {sortedParticipants[1].user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="font-bold text-lg text-foreground truncate w-full text-center">
                  {sortedParticipants[1].user?.name}
                </div>
                <div className="text-sm text-verdict-green font-utility">{sortedParticipants[1].score || 0} pts</div>
                <div className="w-full h-24 bg-gradient-to-t from-surface to-[#C0C0C0]/20 mt-4 rounded-t-lg flex justify-center pt-2">
                  <span className="text-[#C0C0C0] font-bold text-xl">2</span>
                </div>
              </div>
            )}
            
            {/* 1st Place */}
            <div className="flex flex-col items-center w-1/3 max-w-[180px]">
              <div className="h-20 w-20 rounded-sm bg-surface border-4 border-host-amber overflow-hidden mb-3">
                {sortedParticipants[0].user?.avatarUrl ? (
                  <img src={sortedParticipants[0].user.avatarUrl} alt="1st" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-host-amber/20 text-host-amber">
                    {sortedParticipants[0].user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="font-bold text-xl text-host-amber truncate w-full text-center">
                {sortedParticipants[0].user?.name}
              </div>
              <div className="text-sm text-verdict-green font-utility font-bold">{sortedParticipants[0].score || 0} pts</div>
              <div className="w-full h-32 bg-gradient-to-t from-surface to-host-amber/20 mt-4 rounded-t-lg flex justify-center pt-2">
                <span className="text-host-amber font-bold text-2xl">1</span>
              </div>
            </div>

            {/* 3rd Place */}
            {sortedParticipants.length > 2 && (
              <div className="flex flex-col items-center w-1/3 max-w-[160px]">
                <div className="h-12 w-12 rounded-sm bg-surface border-2 border-[#CD7F32] overflow-hidden mb-3">
                  {sortedParticipants[2].user?.avatarUrl ? (
                    <img src={sortedParticipants[2].user.avatarUrl} alt="3rd" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold bg-[#CD7F32]/20 text-[#CD7F32]">
                      {sortedParticipants[2].user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="font-bold text-md text-foreground truncate w-full text-center">
                  {sortedParticipants[2].user?.name}
                </div>
                <div className="text-sm text-verdict-green font-utility">{sortedParticipants[2].score || 0} pts</div>
                <div className="w-full h-16 bg-gradient-to-t from-surface to-[#CD7F32]/20 mt-4 rounded-t-lg flex justify-center pt-2">
                  <span className="text-[#CD7F32] font-bold text-lg">3</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="bg-surface border border-hairline rounded-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ink border-b border-hairline text-muted uppercase tracking-wider text-xs font-semibold">
                <th className="p-4">Rank</th>
                <th className="p-4">Participant</th>
                <th className="p-4">Score</th>
                {questions.map((q, idx) => (
                  <th key={q._id} className="p-4 text-center">Q{idx + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedParticipants.map((p, idx) => (
                <tr key={p.user?._id || idx} className="border-b border-hairline hover:bg-ink/50 transition-colors">
                  <td className="p-4 font-bold text-muted">#{idx + 1}</td>
                  <td className="p-4 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-sm overflow-hidden bg-ink">
                      {p.user?.avatarUrl ? (
                        <img src={p.user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-utility text-muted border border-hairline">
                          {p.user?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="font-semibold">{p.user?.name || 'Unknown'}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-utility font-bold text-verdict-green">{p.score || 0} pts</div>
                    {p.penalties > 0 && <div className="text-xs text-verdict-red font-utility">{p.penalties} penalties</div>}
                  </td>
                  {questions.map((q) => {
                    const solved = p.solvedProblems?.some(
                      (sp) => (sp.problem?._id || sp.problem) === q._id && sp.verdict === 'Accepted'
                    );
                    return (
                      <td key={q._id} className="p-4 text-center">
                        {solved ? (
                          <CheckCircle2 className="w-5 h-5 text-verdict-green mx-auto" />
                        ) : (
                          <span className="text-muted/30">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-8">
          <button 
            onClick={() => navigate('/battles/create')}
            className="bg-signal text-ink px-6 py-3 rounded-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Create New Battle
          </button>
          <Link 
            to="/problems"
            className="bg-surface text-foreground border border-hairline px-6 py-3 rounded-sm font-semibold hover:bg-ink transition-colors flex items-center"
          >
            Back to Practice
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default BattleResults;
