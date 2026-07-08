import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { updateParticipants, battleStarted, serverTimeSynced, leaderboardUpdated, battleEnded } from '../store/battleSlice';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const useBattleSocket = (roomCode, onError) => {
  const [socket, setSocket] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!roomCode) return;

    // Connect to the socket server
    const newSocket = io(SOCKET_URL, {
      withCredentials: true, // Send httpOnly cookies
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected successfully!');
      // Join the specific room upon connection
      newSocket.emit('battle:join', roomCode);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connect_error:', err);
      if (onError) onError(err);
    });

    newSocket.on('battle:participant_joined', (participants) => {
      // Overwrite the local Redux state with authoritative participants array
      dispatch(updateParticipants(participants));
    });

    newSocket.on('battle:error', (error) => {
      if (onError) onError(error);
    });

    newSocket.on('battle:started', (data) => {
      dispatch(battleStarted(data));
    });

    newSocket.on('battle:timer_sync', (data) => {
      dispatch(serverTimeSynced(data));
    });

    newSocket.on('battle:leaderboard_update', (data) => {
      dispatch(leaderboardUpdated(data));
    });

    newSocket.on('battle:ended', (data) => {
      dispatch(battleEnded(data));
    });

    // Cleanup on unmount or roomCode change
    return () => {
      newSocket.disconnect();
    };
  }, [roomCode, dispatch]); // omitting onError from deps to prevent infinite loops if not memoized

  return socket;
};

export default useBattleSocket;
