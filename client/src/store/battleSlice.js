import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const createBattle = createAsyncThunk(
  'battle/create',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await api.post('/battles/create', settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to create battle'
      );
    }
  }
);

export const joinBattle = createAsyncThunk(
  'battle/join',
  async (roomCode, { rejectWithValue }) => {
    try {
      const response = await api.post(`/battles/${roomCode}/join`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to join battle'
      );
    }
  }
);

export const fetchBattle = createAsyncThunk(
  'battle/fetch',
  async (roomCode, { rejectWithValue }) => {
    try {
      const response = await api.get(`/battles/${roomCode}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch battle'
      );
    }
  }
);

const initialState = {
  currentBattle: null,
  isLoading: false,
  error: null,
  serverTimeOffset: null,
  leaderboard: [],
};

const battleSlice = createSlice({
  name: 'battle',
  initialState,
  reducers: {
    clearBattle(state) {
      state.currentBattle = null;
      state.error = null;
    },
    updateParticipants(state, action) {
      if (state.currentBattle) {
        state.currentBattle.participants = action.payload;
      }
    },
    battleStarted(state, action) {
      if (state.currentBattle) {
        state.currentBattle.status = 'in_progress';
        state.currentBattle.questions = action.payload.questions;
        state.currentBattle.duration = action.payload.duration;
        state.currentBattle.startedAt = action.payload.startedAt;
      }
    },
    serverTimeSynced(state, action) {
      state.serverTimeOffset = action.payload.serverTime - Date.now();
    },
    leaderboardUpdated(state, action) {
      state.leaderboard = action.payload;
      // Optionally also keep currentBattle.participants in sync with the leaderboard array
      if (state.currentBattle) {
        state.currentBattle.participants = action.payload;
      }
    },
    battleEnded(state, action) {
      if (state.currentBattle) {
        state.currentBattle.status = 'completed';
        state.currentBattle.participants = action.payload;
      }
      state.leaderboard = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // createBattle
      .addCase(createBattle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBattle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBattle = action.payload;
      })
      .addCase(createBattle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // joinBattle
      .addCase(joinBattle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinBattle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBattle = action.payload;
      })
      .addCase(joinBattle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // fetchBattle
      .addCase(fetchBattle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBattle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBattle = action.payload;
      })
      .addCase(fetchBattle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBattle, updateParticipants, battleStarted, serverTimeSynced, leaderboardUpdated, battleEnded } = battleSlice.actions;

export default battleSlice.reducer;
