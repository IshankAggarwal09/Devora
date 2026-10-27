import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// Fetch all tasks for a project
export const fetchProjectTasks = createAsyncThunk(
  'tasks/fetchProjectTasks',
  async ({ projectId, filters = {} }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.assignee) params.append('assignee', filters.assignee);
      if (filters.priority) params.append('priority', filters.priority);

      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/projects/${projectId}/tasks${query}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch project tasks'
      );
    }
  }
);

// Create task in a project
export const createTask = createAsyncThunk(
  'tasks/createTask',
  async ({ projectId, taskData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/projects/${projectId}/tasks`, taskData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to create task'
      );
    }
  }
);

// Update task status, assignee, priority, etc.
export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/tasks/${taskId}`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue({
        taskId,
        error: error.response?.data?.error || 'Failed to update task',
      });
    }
  }
);

const initialState = {
  tasks: [],
  isLoading: false,
  isCreating: false,
  error: null,
  filters: {
    assignee: '',
    priority: '',
  },
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // Optimistic status update for drag-and-drop
    optimisticMoveTask: (state, action) => {
      const { taskId, newStatus } = action.payload;
      const task = state.tasks.find((t) => t._id === taskId);
      if (task) {
        task.status = newStatus;
      }
    },
    // Revert if API call fails
    revertMoveTask: (state, action) => {
      const { taskId, previousStatus } = action.payload;
      const task = state.tasks.find((t) => t._id === taskId);
      if (task) {
        task.status = previousStatus;
      }
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = { assignee: '', priority: '' };
    },
    clearTasks: (state) => {
      state.tasks = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProjectTasks
      .addCase(fetchProjectTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchProjectTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // createTask
      .addCase(createTask.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isCreating = false;
        state.tasks.unshift(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })

      // updateTask
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.payload?.error || 'Failed to update task';
      });
  },
});

export const {
  optimisticMoveTask,
  revertMoveTask,
  setFilters,
  resetFilters,
  clearTasks,
} = taskSlice.actions;

export default taskSlice.reducer;
