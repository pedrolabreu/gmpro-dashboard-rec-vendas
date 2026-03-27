import { useState, useEffect } from 'react';
import { salesData as fallbackData } from '../data/salesData';
import { APPS_SCRIPT_URL } from '../config';

export function useSalesData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [source, setSource] = useState('local');

  useEffect(() => {
    if (!APPS_SCRIPT_URL) {
      // Sem URL configurada: usa dados locais
      setData(fallbackData);
      setSource('local');
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(APPS_SCRIPT_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json.data || []);
        setUpdatedAt(json.updatedAt || null);
        setSource('sheets');
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message);
        // Fallback para dados locais em caso de erro
        setData(fallbackData);
        setSource('local');
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Atualiza automaticamente a cada 5 minutos
    const interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  return { data, loading, error, updatedAt, source };
}
