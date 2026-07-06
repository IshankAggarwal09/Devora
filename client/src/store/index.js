import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import problemsReducer from './problemsSlice';
import submissionReducer from './submissionSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    problems: problemsReducer,
    submission: submissionReducer,
  },
});

export default store;
