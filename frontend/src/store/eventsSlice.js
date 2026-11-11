import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { getErrorMessage } from '../api/axios';

// Liste paginée des événements
export const fetchEvents = createAsyncThunk('events/fetch', async ({ page = 1, upcoming = false } = {}, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/events', { params: { page, limit: 6, upcoming: upcoming || undefined } });
    return data; // { data: [...], pagination }
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// Inscription / désinscription : renvoie le nouvel état de l'événement concerné
export const toggleRegistration = createAsyncThunk('events/toggle', async ({ id, registered }, { rejectWithValue }) => {
  try {
    const { data } = registered
      ? await api.delete(`/events/${id}/register`)
      : await api.post(`/events/${id}/register`);
    return { id, isRegistered: !registered, participantsCount: data.participantsCount };
  } catch (err) {
    return rejectWithValue({ id, message: getErrorMessage(err) });
  }
});

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    items: [],
    pagination: { page: 1, pages: 1, total: 0 },
    upcoming: true,
    status: 'idle', // idle | loading | failed
    error: null,
    actionError: null // erreur d'inscription, affichée sur la carte concernée
  },
  reducers: {
    setUpcoming: (state, action) => {
      state.upcoming = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(toggleRegistration.pending, (state) => {
        state.actionError = null;
      })
      .addCase(toggleRegistration.fulfilled, (state, action) => {
        const event = state.items.find((e) => e._id === action.payload.id);
        if (event) {
          event.isRegistered = action.payload.isRegistered;
          event.participantsCount = action.payload.participantsCount;
          event.isFull = event.participantsCount >= event.capacity;
        }
      })
      .addCase(toggleRegistration.rejected, (state, action) => {
        state.actionError = action.payload;
      });
  }
});

export const { setUpcoming } = eventsSlice.actions;
export default eventsSlice.reducer;