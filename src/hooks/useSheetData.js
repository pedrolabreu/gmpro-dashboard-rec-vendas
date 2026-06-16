import { useState, useEffect, useCallback, useRef } from 'react';

const AUTO_REFRESH_MS = 60 * 1000;

// Hook genérico de fetch+parse de uma aba do Google Sheets (CSV), com
// auto-refresh periódico e refresh manual. `parse` recebe o texto do CSV e
// devolve os dados já estruturados; `isEmpty`/`emptyError` permitem tratar
// planilhas vazias como erro (opcional).
export function useSheetData(url, parse, { initialData = [], emptyError, isEmpty } = {}) {
  const [data, setData]             = useState(initialData);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);
  const [updatedAt, setUpdatedAt]   = useState(null);
  const intervalRef                 = useRef(null);

  const fetchData = useCallback(async (isManual = false) => {
    if (!url) { setLoading(false); return; }

    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${url}&t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parse(text);
      const empty = isEmpty ? isEmpty(parsed) : parsed.length === 0;
      if (empty && emptyError) throw new Error(emptyError);
      setData(parsed);
      setUpdatedAt(new Date().toISOString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [url, parse, emptyError, isEmpty]);

  useEffect(() => {
    fetchData(false);
    intervalRef.current = setInterval(() => fetchData(false), AUTO_REFRESH_MS);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, refreshing, error, updatedAt, refetch };
}
