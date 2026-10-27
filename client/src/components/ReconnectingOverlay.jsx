import { useState, useEffect } from 'react';
import { Radio, RefreshCw } from 'lucide-react';

/**
 * ReconnectingOverlay
 * Displays a non-intrusive, sleek overlay when the WebSocket connection is dropped
 * or re-synchronizing with the server, fading out smoothly once state is restored.
 *
 * @param {object} props
 * @param {boolean} props.isVisible - Whether the socket is currently reconnecting
 * @param {string} [props.roomCode] - Current battle room code
 * @param {string} [props.message]  - Custom status message
 */
const ReconnectingOverlay = ({
  isVisible = false,
  roomCode,
  message = 'Restoring timer, leaderboard & submission state...',
}) => {
  // Keep component in DOM during fade-out animation
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timeout = setTimeout(() => {
        setShouldRender(false);
      }, 400); // match transition duration
      return () => clearTimeout(timeout);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink/85 backdrop-blur-sm transition-opacity duration-300 ease-out ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`bg-surface border border-hairline/80 shadow-2xl rounded-lg p-6 sm:p-8 max-w-sm w-full text-center space-y-5 transition-transform duration-300 ease-out ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-1'
        }`}
      >
        {/* Animated Beacon Indicator */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-signal/15 animate-ping" />
          <div className="relative w-12 h-12 rounded-full bg-ink border border-signal/30 flex items-center justify-center text-signal shadow-inner">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-lg font-bold font-display text-foreground tracking-wide">
              Reconnecting to Battle
            </h3>
            <RefreshCw className="w-3.5 h-3.5 text-signal animate-spin shrink-0" />
          </div>
          <p className="text-xs text-muted leading-relaxed font-body">
            {message}
          </p>
        </div>

        {/* Room Code Badge */}
        {roomCode && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-ink/60 border border-hairline rounded-full text-xs font-utility text-muted">
            <span className="text-[10px] uppercase font-semibold text-muted/70 tracking-wider">Room:</span>
            <span className="font-bold text-signal tracking-widest">{roomCode}</span>
          </div>
        )}

        {/* Indeterminate Progress Bar */}
        <div className="w-full bg-ink/80 h-1 rounded-full overflow-hidden border border-hairline/40">
          <div className="h-full bg-gradient-to-r from-transparent via-signal to-transparent w-full animate-indeterminate" />
        </div>
      </div>
    </div>
  );
};

export default ReconnectingOverlay;
