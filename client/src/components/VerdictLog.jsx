import { useMemo } from 'react';

const LOG_LINES = [
  { status: '+ Accepted', problem: 'Two Sum', time: '0.042s', color: 'text-verdict-green' },
  { status: '- Wrong Answer', problem: 'Merge Intervals', time: 'N/A', color: 'text-verdict-red' },
  { status: '+ Accepted', problem: 'LRU Cache', time: '0.115s', color: 'text-verdict-green' },
  { status: '- Time Limit', problem: 'Word Ladder', time: '2.001s', color: 'text-verdict-red' },
  { status: '+ Accepted', problem: 'Trapping Rain Water', time: '0.089s', color: 'text-verdict-green' },
  { status: '+ Accepted', problem: 'Valid Parentheses', time: '0.001s', color: 'text-verdict-green' },
  { status: '- Runtime Error', problem: 'Reverse Linked List', time: 'N/A', color: 'text-verdict-red' },
  { status: '+ Accepted', problem: 'Climbing Stairs', time: '0.021s', color: 'text-verdict-green' },
  { status: '- Memory Limit', problem: 'N-Queens', time: '0.942s', color: 'text-verdict-red' },
  { status: '+ Accepted', problem: 'Number of Islands', time: '0.155s', color: 'text-verdict-green' },
];

const VerdictLog = () => {
  // Duplicate the array to create a seamless loop
  const displayLines = useMemo(() => [...LOG_LINES, ...LOG_LINES, ...LOG_LINES, ...LOG_LINES], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none opacity-20">
      <div className="absolute w-full flex flex-col gap-4 animate-scroll whitespace-nowrap pl-12 pt-8">
        {displayLines.map((line, i) => (
          <div key={i} className={`font-utility text-sm flex items-center gap-8 ${line.color}`}>
            <span className="w-32">{line.status}</span>
            <span className="w-48 text-muted">{line.problem}</span>
            <span className="text-muted/60">{line.time}</span>
          </div>
        ))}
      </div>
      {/* Fade out top and bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink via-transparent to-ink pointer-events-none" />
    </div>
  );
};

export default VerdictLog;
