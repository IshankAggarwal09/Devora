import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const adminFetchProblems = createAsyncThunk(
  'admin/fetchProblems',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/admin/problems');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch problems');
    }
  }
);

export const adminFetchProblemById = createAsyncThunk(
  'admin/fetchProblemById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/admin/problems/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch problem');
    }
  }
);

export const adminCreateProblem = createAsyncThunk(
  'admin/createProblem',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post('/admin/problems', payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create problem');
    }
  }
);

export const adminUpdateProblem = createAsyncThunk(
  'admin/updateProblem',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/admin/problems/${id}`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update problem');
    }
  }
);

export const adminDeleteProblem = createAsyncThunk(
  'admin/deleteProblem',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/problems/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete problem');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    problems: [],
    currentProblem: null,
    isLoading: false,
    isSaving: false,
    error: null,
  },
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
    clearCurrentProblem: (state) => {
      state.currentProblem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProblems
      .addCase(adminFetchProblems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(adminFetchProblems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.problems = action.payload;
      })
      .addCase(adminFetchProblems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // fetchProblemById
      .addCase(adminFetchProblemById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.currentProblem = null;
      })
      .addCase(adminFetchProblemById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProblem = action.payload;
      })
      .addCase(adminFetchProblemById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // createProblem
      .addCase(adminCreateProblem.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(adminCreateProblem.fulfilled, (state, action) => {
        state.isSaving = false;
        state.problems.unshift(action.payload);
      })
      .addCase(adminCreateProblem.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      // updateProblem
      .addCase(adminUpdateProblem.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(adminUpdateProblem.fulfilled, (state, action) => {
        state.isSaving = false;
        const idx = state.problems.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.problems[idx] = action.payload;
        state.currentProblem = action.payload;
      })
      .addCase(adminUpdateProblem.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      // deleteProblem
      .addCase(adminDeleteProblem.fulfilled, (state, action) => {
        state.problems = state.problems.filter((p) => p._id !== action.payload);
      })
      .addCase(adminDeleteProblem.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearAdminError, clearCurrentProblem } = adminSlice.actions;
export default adminSlice.reducer;
