import { useState, useEffect, useCallback, useRef } from 'react';
import { salesData as fallbackData } from '../data/salesData';
import { SHEETS_CSV_URL } from '../config';

// Colunas do CSV (mesma ordem do Sheets)
// A=0  B=1          C=2           D=3            E=4               F=5        G=6         H=7
// Dia  Gasto Total  Fat. Total    Gasto Período  Fat. Período      ROI Total  ROI Período Qtd Envios Período
//
// I=8               J=9                K=10              L=11              M=12            N=13
// Qtd Envios Total  Qtd Vendas Período Conversão Período  Qtd Vendas Total  Conversão Total Qtd Reembolsos

const AUTO_REFRESH_MS = 60 * 1000; // 1 minuto

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  return lines.slice(1).map(line => {
    const cols = splitCSVLine(line);
    const dia = cols[0]?.trim() ?? '';
    if (!dia) return null;

    return {
      dia:                  dia,
      gastoTotal:           parseVal(cols[1]),
      faturamentoTotal:     parseVal(cols[2]),
      gastoperiodo:         parseVal(cols[3]),
      faturamentoPeriodo:   parseVal(cols[4]),
      roiTotal:             parseVal(cols[5]),
      roiPeriodo:           parseVal(cols[6]),
      quantEnvios:          parseIntVal(cols[7]),
      quantEnviosTotal:     parseIntVal(cols[8]),
      quantVendasPeriodo:   parseIntVal(cols[9]),
      conversaoPeriodo:     parseVal(cols[10]),
      quantVendasTotal:     parseIntVal(cols[11]),
      conversaoTotal:       parseVal(cols[12]),
      quantReembolsos:      parseIntVal(cols[13]),
    };
  }).filter(Boolean);
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
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

function parseIntVal(v) {
  if (!v || v.trim() === '' || v.startsWith('#')) return 0;
  const n = parseInt(v.trim(), 10);
  return isNaN(n) ? 0 : n;
}

export function useSalesData() {
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [source, setSource]       = useState('local');
  const intervalRef               = useRef(null);

  const fetchData = useCallback(async (isManual = false) => {
    if (!SHEETS_CSV_URL) {
      setData(fallbackData);
      setSource('local');
      setLoading(false);
      return;
    }

    // Primeira carga usa loading, refreshes manuais/auto usam refreshing
    if (isManual) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      // Cache-bust para garantir dados frescos do Google (ignora cache do browser)
      const url = `${SHEETS_CSV_URL}&t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

      const text = await res.text();
      const parsed = parseCSV(text);

      if (!parsed.length) throw new Error('Nenhum dado encontrado na planilha.');

      setData(parsed);
      setUpdatedAt(new Date().toISOString());
      setSource('sheets');
    } catch (err) {
      setError(err.message);
      if (!data.length) {
        setData(fallbackData);
        setSource('local');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Carga inicial + auto-refresh a cada 1 minuto
  useEffect(() => {
    fetchData(false);

    intervalRef.current = setInterval(() => fetchData(false), AUTO_REFRESH_MS);

    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, refreshing, error, updatedAt, source, refetch };
}
