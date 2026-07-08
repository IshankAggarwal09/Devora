import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import problemsReducer from './problemsSlice';
import submissionReducer from './submissionSlice';
import battleReducer from './battleSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    problems: problemsReducer,
    submission: submissionReducer,
    battle: battleReducer,
  },
});

export default store;
