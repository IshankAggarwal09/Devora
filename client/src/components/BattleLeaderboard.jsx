import React from 'react';

const BattleLeaderboard = ({ participants }) => {
  // Sort participants: score desc, then by lastScoreUpdate asc (tiebreak)
  const sortedParticipants = [...(participants || [])].sort((a, b) => {
    if (b.score !== a.score) {
      return (b.score || 0) - (a.score || 0);
    }
    const aTime = a.lastScoreUpdate ? new Date(a.lastScoreUpdate).getTime() : 0;
    const bTime = b.lastScoreUpdate ? new Date(b.lastScoreUpdate).getTime() : 0;
    return aTime - bTime;
  });

  return (
    <div className="flex gap-4 overflow-x-auto p-4 items-center bg-ink border-b border-hairline relative">
      {sortedParticipants.map((p, index) => {
        let rankColor = 'text-muted';
        if (index === 0) rankColor = 'text-host-amber';
        else if (index === 1) rankColor = 'text-foreground';
        else if (index === 2) rankColor = 'text-foreground/80';

        return (
          <div
            key={p.user?._id || index}
            className="flex flex-col items-center bg-surface border border-hairline rounded-sm px-4 py-2 min-w-[140px] transition-all duration-500 ease-in-out"
          >
            <div className="flex w-full justify-between items-center mb-1">
              <span className={`text-xs font-semibold uppercase tracking-wider ${rankColor}`}>
                #{index + 1}
              </span>
              <span className="text-xs font-utility bg-verdict-green/10 text-verdict-green px-1.5 py-0.5 rounded-sm">
                {p.score || 0}
              </span>
            </div>
            
            <div className="flex items-center gap-2 w-full mt-1">
              <div className="h-6 w-6 rounded-sm bg-ink border border-hairline overflow-hidden flex-shrink-0">
                {p.user?.avatarUrl ? (
                  <img src={p.user.avatarUrl} alt={p.user.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[10px] font-utility text-muted">
                    {p.user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="font-semibold text-sm truncate flex-grow">
                {p.user?.name || 'Unknown'}
              </span>
            </div>
            
            {p.penalties > 0 && (
              <span className="text-[10px] text-verdict-red mt-1 font-utility w-full text-right">
                {p.penalties} penalt{p.penalties !== 1 ? 'ies' : 'y'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BattleLeaderboard;
