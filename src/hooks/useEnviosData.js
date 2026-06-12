import { useState, useEffect, useCallback, useRef } from 'react';
import { ENVIOS_CSV_URL } from '../config';

const AUTO_REFRESH_MS = 60 * 1000;

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

function parseDate(str) {
  if (!str) return null;
  if (str.includes('/')) {
    const [d, m, y] = str.split('/');
    return new Date(+y, +m - 1, +d);
  }
  if (str.includes('-')) {
    const [y, m, d] = str.split('-');
    return new Date(+y, +m - 1, +d);
  }
  return null;
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  return lines.slice(1).map(line => {
    const cols = splitCSVLine(line);
    const data = cols[0]?.trim() ?? '';
    if (!data) return null;
    return {
      data,
      tipo: cols[4]?.trim().toLowerCase() ?? '', // col E: recuperacao / onboarding
    };
  }).filter(Boolean);
}

export function useEnviosData() {
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const intervalRef                 = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const url = `${ENVIOS_CSV_URL}&t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseCSV(text);
      setData(parsed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, AUTO_REFRESH_MS);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  // Conta envios filtrados por tipo e intervalo de datas
  const countEnvios = useCallback((tipo, from, to) => {
    return data.filter(r => {
      if (tipo && r.tipo !== tipo) return false;
      const d = parseDate(r.data);
      if (!d) return false;
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      return true;
    }).length;
  }, [data]);

  return { data, loading, error, countEnvios };
}
