import { useState, useEffect, useCallback } from 'react';
import api, { getErrorMessage } from '../api/axios';

// Hook personnalisé : charge une ressource de l'API et expose { data, loading, error, reload }.
// Évite de répéter useState + useEffect + try/catch dans chaque page.
export default function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState(null);

  // useCallback : la fonction garde la même identité tant que l'URL ne change pas
  const load = useCallback(async (signal) => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(url, { signal });
      setData(response.data);
    } catch (err) {
      if (err.name !== 'CanceledError') setError(getErrorMessage(err));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    // AbortController : si la page change avant la réponse, la requête est annulée
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return { data, loading, error, reload: () => load(), setData };
}