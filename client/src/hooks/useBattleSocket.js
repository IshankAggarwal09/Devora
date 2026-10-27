import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateParticipants,
  battleStarted,
  serverTimeSynced,
  leaderboardUpdated,
  battleEnded,
  battleRejoined,
} from '../store/battleSlice';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

/**
 * useBattleSocket
 * Socket.IO hook for Devora battle rooms with robust automatic reconnection handling.
 * When connection drops or page refreshes, automatically re-emits 'rejoin-battle'
 * with room code & user credentials from Redux / localStorage, restoring server-authoritative state.
 *
 * @param {string} roomCode
 * @param {function} [onError]
 * @returns {{ socket: Socket|null, isReconnecting: boolean }}
 */
const useBattleSocket = (roomCode, onError) => {
  const [socket, setSocket] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const hasConnectedOnceRef = useRef(false);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Keep a stable ref to user and onError
  const userRef = useRef(user);
  userRef.current = user;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Helper to retrieve current user info from Redux or localStorage fallback
  const getCurrentUser = useCallback(() => {
    if (userRef.current) return userRef.current;
    try {
      const stored = localStorage.getItem('devora_user') || localStorage.getItem('user');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed parsing user from localStorage:', e);
    }
    return null;
  }, []);

  useEffect(() => {
    if (!roomCode) return;

    // Connect to Socket.IO with auto-reconnection configured
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 4000,
      timeout: 10000,
    });

    setSocket(newSocket);

    // Function to re-emit 'rejoin-battle' with room and user info
    const sendRejoinBattle = () => {
      const currentUser = getCurrentUser();
      const payload = {
        roomCode,
        userId: currentUser?._id || currentUser?.id,
        user: currentUser,
      };

      console.log(`[useBattleSocket] Emitting 'rejoin-battle' for room ${roomCode}`);
      newSocket.emit('rejoin-battle', payload, (response) => {
        if (response?.error) {
          console.warn('[useBattleSocket] rejoin-battle error:', response.error);
          if (onErrorRef.current) onErrorRef.current(response.error);
          setIsReconnecting(false);
        } else if (response?.battleState) {
          console.log('[useBattleSocket] Battle state restored via callback:', response.battleState);
          dispatch(battleRejoined(response.battleState));
          // Fade out reconnecting overlay smoothly
          setTimeout(() => setIsReconnecting(false), 350);
        }
      });
    };

    // Connection established / restored
    newSocket.on('connect', () => {
      console.log(`[useBattleSocket] Socket connected: ${newSocket.id}`);

      if (hasConnectedOnceRef.current) {
        // This is a reconnect after dropped connection
        console.log('[useBattleSocket] Reconnection detected, rejoining battle...');
        sendRejoinBattle();
      } else {
        // Initial connection (could be fresh join or page refresh mid-battle)
        hasConnectedOnceRef.current = true;
        sendRejoinBattle();
      }
    });

    // Disconnect event (e.g. server restart, network drop, sleep mode)
    newSocket.on('disconnect', (reason) => {
      console.warn(`[useBattleSocket] Socket disconnected: ${reason}`);
      if (reason !== 'io client disconnect') {
        setIsReconnecting(true);
      }
    });

    // Reconnection lifecycle events
    newSocket.io.on('reconnect_attempt', (attempt) => {
      console.log(`[useBattleSocket] Reconnecting attempt #${attempt}`);
      setIsReconnecting(true);
    });

    newSocket.io.on('reconnect', (attempt) => {
      console.log(`[useBattleSocket] Reconnected after ${attempt} attempts`);
      sendRejoinBattle();
    });

    newSocket.on('connect_error', (err) => {
      console.error('[useBattleSocket] Connection error:', err);
      setIsReconnecting(true);
      if (onErrorRef.current) onErrorRef.current(err);
    });

    // Listen for server state restoration events
    newSocket.on('rejoin-battle:success', (battleState) => {
      console.log('[useBattleSocket] rejoin-battle:success received');
      dispatch(battleRejoined(battleState));
      setTimeout(() => setIsReconnecting(false), 350);
    });

    newSocket.on('battle:rejoined', (battleState) => {
      dispatch(battleRejoined(battleState));
      setTimeout(() => setIsReconnecting(false), 350);
    });

    newSocket.on('battle:participant_joined', (participants) => {
      dispatch(updateParticipants(participants));
    });

    newSocket.on('battle:error', (error) => {
      if (onErrorRef.current) onErrorRef.current(error);
      setIsReconnecting(false);
    });

    newSocket.on('battle:started', (data) => {
      dispatch(battleStarted(data));
      setIsReconnecting(false);
    });

    newSocket.on('battle:timer_sync', (data) => {
      dispatch(serverTimeSynced(data));
    });

    newSocket.on('battle:leaderboard_update', (data) => {
      dispatch(leaderboardUpdated(data));
    });

    newSocket.on('battle:ended', (data) => {
      dispatch(battleEnded(data));
      setIsReconnecting(false);
    });

    // Cleanup on unmount or roomCode change
    return () => {
      newSocket.disconnect();
    };
  }, [roomCode, dispatch, getCurrentUser]);

  return { socket, isReconnecting };
};

export default useBattleSocket;
