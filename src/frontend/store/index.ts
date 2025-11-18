import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import wizardReducer from './wizardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    wizard: wizardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
