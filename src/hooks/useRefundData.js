import { useState, useEffect, useCallback, useRef } from 'react';
import { REFUNDS_CSV_URL } from '../config';

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

// Normaliza nome de coluna: minúsculas, sem acento, sem espaço
function normalizeKey(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = splitCSVLine(lines[0]).map(h => h.trim());
  const normHeaders = headers.map(normalizeKey);

  // Detecta índices pelos nomes das colunas
  const idx = (names) => {
    for (const n of names) {
      const i = normHeaders.indexOf(normalizeKey(n));
      if (i !== -1) return i;
    }
    return -1;
  };

  const dataIdx   = idx(['data', 'date', 'dia']);
  const emailIdx  = idx(['email', 'e-mail']);
  const valorIdx  = idx(['valor', 'value', 'preco', 'preço', 'amount']);
  const motivoIdx = idx(['motivo', 'reason', 'descricao', 'descrição', 'tipo']);
  const produtoIdx = idx(['produto', 'product', 'item']);

  const rows = lines.slice(1).map(line => {
    const cols = splitCSVLine(line);
    if (!cols[0]?.trim()) return null;

    const row = {
      data:    dataIdx  >= 0 ? (cols[dataIdx]?.trim()  ?? '') : (cols[0]?.trim() ?? ''),
      email:   emailIdx >= 0 ? (cols[emailIdx]?.trim() ?? '') : (cols[1]?.trim() ?? ''),
      valor:   valorIdx >= 0 ? parseVal(cols[valorIdx])       : parseVal(cols[2]),
      motivo:  motivoIdx  >= 0 ? (cols[motivoIdx]?.trim()  ?? '') : '',
      produto: produtoIdx >= 0 ? (cols[produtoIdx]?.trim() ?? '') : '',
      // guarda todas as colunas para exibição completa na tabela
      _raw: cols.map(c => c?.trim() ?? ''),
    };
    return row;
  }).filter(Boolean);

  return { headers, rows };
}

export function useRefundData() {
  const [rows, setRows]             = useState([]);
  const [headers, setHeaders]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);
  const [updatedAt, setUpdatedAt]   = useState(null);
  const intervalRef                 = useRef(null);

  const fetchData = useCallback(async (isManual = false) => {
    if (!REFUNDS_CSV_URL) { setLoading(false); return; }

    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const url = `${REFUNDS_CSV_URL}&t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      const text = await res.text();
      const { headers: h, rows: r } = parseCSV(text);
      if (!r.length) throw new Error('Nenhum reembolso encontrado na planilha.');
      setHeaders(h);
      setRows(r);
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

  return { rows, headers, loading, refreshing, error, updatedAt, refetch };
}
