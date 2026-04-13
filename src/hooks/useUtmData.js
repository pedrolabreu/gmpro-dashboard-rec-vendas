import { useState, useEffect, useCallback, useRef } from 'react';
import { UTM_CSV_URL } from '../config';

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

function parseVal(v) {
  if (!v || v.trim() === '' || v.startsWith('#')) return 0;
  const str = v.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

// Detecta se coluna C (oculta no Sheets) está presente no CSV
// Se cols[3] começa com R$ → layout 6 colunas (A B C_oculta D E F)
// Caso contrário → layout 5 colunas (A B D E F)
function getIndices(cols) {
  const c3 = cols[3]?.trim() ?? '';
  const c2 = cols[2]?.trim() ?? '';
  if (c3.startsWith('R$') || c3.replace(/[^0-9]/g, '').length > 0 && !c2.startsWith('R$')) {
    return { valorIdx: 3, termIdx: 4, mediumIdx: 5 };
  }
  return { valorIdx: 2, termIdx: 3, mediumIdx: 4 };
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  let indices = null;

  return lines.slice(1).map(line => {
    const cols = splitCSVLine(line);
    const data = cols[0]?.trim() ?? '';
    if (!data) return null;

    if (!indices) indices = getIndices(cols);
    const { valorIdx, termIdx, mediumIdx } = indices;

    return {
      data:      data,
      email:     cols[1]?.trim() ?? '',
      valor:     parseVal(cols[valorIdx]),
      utmTerm:   cols[termIdx]?.trim() ?? '',
      utmMedium: cols[mediumIdx]?.trim() ?? '',
    };
  }).filter(Boolean);
}

export function useUtmData() {
  const [data, setData]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState(null);
  const [updatedAt, setUpdatedAt]     = useState(null);
  const intervalRef                   = useRef(null);

  const fetchData = useCallback(async (isManual = false) => {
    if (!UTM_CSV_URL) { setLoading(false); return; }

    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const url = `${UTM_CSV_URL}&t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseCSV(text);
      if (!parsed.length) throw new Error('Nenhuma venda encontrada na planilha.');
      setData(parsed);
      setUpdatedAt(new Date().toISOString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
    intervalRef.current = setInterval(() => fetchData(false), AUTO_REFRESH_MS);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, refreshing, error, updatedAt, refetch };
}
