import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { fetchCurrentUser } from './authSlice'; // To refresh solved problems

export const submitSolution = createAsyncThunk(
  'submission/submit',
  async ({ problemId, language, code }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post(`/problems/${problemId}/submit`, {
        language,
        code,
      });
      
      // If the submission was Accepted, we should fetch the current user again
      // to update the solvedProblems array in the auth slice.
      if (response.data.verdict === 'Accepted') {
        dispatch(fetchCurrentUser());
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to submit solution'
      );
    }
  }
);

export const runSolution = createAsyncThunk(
  'submission/run',
  async ({ problemId, language, code }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/problems/${problemId}/run`, {
        language,
        code,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to run solution'
      );
    }
  }
);

export const fetchLatestSubmission = createAsyncThunk(
  'submission/fetchLatest',
  async (problemId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/problems/${problemId}/submission/latest`);
      return response.data; // this will be null if no submission exists
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch latest submission'
      );
    }
  }
);

const initialState = {
  currentSubmission: null,
  isSubmitting: false,
  error: null,
  
  runResult: null,
  isRunning: false,
  runError: null,
  
  lastSavedSubmission: null,
  isFetchingLatest: false,
};

const submissionSlice = createSlice({
  name: 'submission',
  initialState,
  reducers: {
    clearSubmission(state) {
      state.currentSubmission = null;
      state.error = null;
      state.runResult = null;
      state.runError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitSolution.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
        state.runResult = null; // clear previous run
      })
      .addCase(submitSolution.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.currentSubmission = action.payload;
      })
      .addCase(submitSolution.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })
      .addCase(runSolution.pending, (state) => {
        state.isRunning = true;
        state.runError = null;
        state.currentSubmission = null; // clear previous submit
      })
      .addCase(runSolution.fulfilled, (state, action) => {
        state.isRunning = false;
        state.runResult = action.payload;
      })
      .addCase(runSolution.rejected, (state, action) => {
        state.isRunning = false;
        state.runError = action.payload;
      })
      .addCase(fetchLatestSubmission.pending, (state) => {
        state.isFetchingLatest = true;
        state.lastSavedSubmission = null;
      })
      .addCase(fetchLatestSubmission.fulfilled, (state, action) => {
        state.isFetchingLatest = false;
        state.lastSavedSubmission = action.payload;
      })
      .addCase(fetchLatestSubmission.rejected, (state) => {
        state.isFetchingLatest = false;
        state.lastSavedSubmission = null;
      });
  },
});

export const { clearSubmission } = submissionSlice.actions;

export default submissionSlice.reducer;
