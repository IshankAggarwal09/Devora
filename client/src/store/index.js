import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import problemsReducer from './problemsSlice';
import submissionReducer from './submissionSlice';
import battleReducer from './battleSlice';
import adminReducer from './adminSlice';
import taskReducer from './taskSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    problems: problemsReducer,
    submission: submissionReducer,
    battle: battleReducer,
    admin: adminReducer,
    tasks: taskReducer,
  },
});

export default store;
