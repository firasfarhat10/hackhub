import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { TOKEN_KEY, getErrorMessage } from '../api/axios';

// Actions asynchrones : createAsyncThunk génère pending / fulfilled / rejected
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    return data; // { user, token }
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const register = createAsyncThunk('auth/register', async (form, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', form);
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Au chargement de l'application : le jeton sauvegardé est-il encore valide ?
export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data.user;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const savedToken = localStorage.getItem(TOKEN_KEY);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: savedToken,
    // Sans jeton, la session est connue tout de suite ; sinon il faut attendre /auth/me
    initialized: !savedToken,
    status: 'idle', // idle | loading | failed
    error: null
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem(TOKEN_KEY);
    },
    clearAuthError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // login et register ont exactement le même effet sur la session
    for (const thunk of [login, register]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.status = 'loading';
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.status = 'idle';
          state.user = action.payload.user;
          state.token = action.payload.token;
          localStorage.setItem(TOKEN_KEY, action.payload.token);
        })
        .addCase(thunk.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
        });
    }
    builder
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.initialized = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        // Jeton expiré ou invalide : on repart en visiteur
        state.user = null;
        state.token = null;
        state.initialized = true;
        localStorage.removeItem(TOKEN_KEY);
      });
  }
});

export const { logout, clearAuthError } = authSlice.actions;

// Sélecteurs réutilisables
export const selectUser = (state) => state.auth.user;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';

export default authSlice.reducer;