import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { joinBattle } from '../store/battleSlice';

const JoinBattle = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.battle);
  
  const [roomCode, setRoomCode] = useState('');
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    
    if (roomCode.length !== 6) {
      setLocalError('Room code must be exactly 6 characters.');
      return;
    }

    const action = await dispatch(joinBattle(roomCode));
    
    if (joinBattle.fulfilled.match(action)) {
      navigate(`/battles/${roomCode}`);
    } else {
      // Backend error string is passed through `rejectWithValue` in battleSlice
      const errorMsg = action.payload;
      if (errorMsg === 'Room is full') {
        setLocalError('This room is full and cannot accept more participants.');
      } else if (errorMsg === 'Battle already in progress') {
        setLocalError('This battle is already in progress.');
      } else if (errorMsg && errorMsg.includes('404')) {
        setLocalError('Room not found. Please check the code and try again.');
      } else if (errorMsg) {
        setLocalError(errorMsg);
      } else {
        setLocalError('Room not found. Please check the code and try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-ink text-foreground p-6 flex flex-col items-center justify-center">
      <div className="bg-surface border border-hairline rounded-sm p-8 max-w-sm w-full space-y-6 shadow-xl">
        <h1 className="text-3xl font-bold font-display text-center">Join Battle</h1>
        
        {localError && (
          <div className="bg-verdict-red/10 border border-verdict-red/20 p-4 rounded-sm text-verdict-red text-sm text-center">
            {localError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">Room Code</label>
            <input
              type="text"
              maxLength="6"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="E.g. ABCDEF"
              className="w-full bg-ink border border-hairline rounded-sm p-2 text-center text-xl tracking-[0.5em] font-utility focus:outline-none focus:border-signal uppercase placeholder:tracking-normal"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || roomCode.length !== 6}
            className="w-full bg-signal text-ink font-semibold py-2 rounded-sm transition-colors hover:bg-signal/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Joining...' : 'Join Battle'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinBattle;
