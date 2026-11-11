import axios from 'axios';

// Instance unique : toutes les requêtes partent vers l'API avec la même configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 15000
});

export const TOKEN_KEY = 'hh_token';

// Les intercepteurs ont besoin du store (pour se déconnecter sur un 401).
// On injecte le store depuis main.jsx au lieu de l'importer ici : cela évite
// un import circulaire (store -> slices -> api -> store).
export function setupInterceptors(store, onLogout) {
  // 1. Avant chaque requête : ajout automatique du jeton
  api.interceptors.request.use((config) => {
    const token = store.getState().auth.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // 2. Après chaque réponse : un 401 sur une requête authentifiée = session expirée ou invalide
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const hadToken = Boolean(error.config?.headers?.Authorization);
      if (error.response?.status === 401 && hadToken) {
        onLogout();
      }
      return Promise.reject(error);
    }
  );
}

// Message lisible à partir d'une erreur Axios (réponse de notre errorHandler ou erreur réseau)
export function getErrorMessage(error) {
  const data = error.response?.data;
  if (data?.details?.length) return `${data.message} : ${data.details.join(', ')}`;
  if (data?.message) return data.message;
  if (error.code === 'ECONNABORTED') return 'Le serveur met trop de temps a repondre';
  return "Impossible de joindre l'API";
}

export default api;