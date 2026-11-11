import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import eventsReducer from './eventsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer, // session : utilisateur connecté + jeton
    events: eventsReducer // liste des événements (données métier partagées)
  }
});