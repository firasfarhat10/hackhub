import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { logout } from './store/authSlice';
import { setupInterceptors } from './api/axios';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import './index.css';

// Branche les intercepteurs Axios sur le store : jeton ajouté à chaque requête,
// déconnexion automatique si l'API répond 401 (jeton expiré ou invalide)
setupInterceptors(store, () => store.dispatch(logout()));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  </StrictMode>
);