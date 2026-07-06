import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchProblems = createAsyncThunk(
  'problems/fetchAll',
  async (filters, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.difficulty && filters.difficulty !== 'all') {
        params.append('difficulty', filters.difficulty);
      }
      if (filters.topics && filters.topics.length > 0) {
        params.append('topics', filters.topics.join(','));
      }
      const response = await api.get(`/problems?${params.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch problems'
      );
    }
  }
);

export const fetchProblemBySlug = createAsyncThunk(
  'problems/fetchBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await api.get(`/problems/${slug}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch problem details'
      );
    }
  }
);

const initialState = {
  list: [],
  currentProblem: null,
  filters: {
    difficulty: 'all',
    topics: [],
  },
  isLoading: false,
  error: null,
};

const problemsSlice = createSlice({
  name: 'problems',
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentProblem(state) {
      state.currentProblem = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchProblems
      .addCase(fetchProblems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProblems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchProblems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // fetchProblemBySlug
      .addCase(fetchProblemBySlug.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProblemBySlug.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProblem = action.payload;
      })
      .addCase(fetchProblemBySlug.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearCurrentProblem } = problemsSlice.actions;

export default problemsSlice.reducer;
