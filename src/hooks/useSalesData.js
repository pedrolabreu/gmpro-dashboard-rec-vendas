import { useState, useEffect } from 'react';
import { salesData as fallbackData } from '../data/salesData';
import { SHEETS_CSV_URL } from '../config';

// Colunas do CSV (mesma ordem do Sheets)
// A=0  B=1            C=2                 D=3             E=4                   F=5        G=6         H=7
// Dia  Gasto Total    Fat. Total          Gasto Período   Fat. Período          ROI Total  ROI Período Qtd Envios

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  // Ignora linha de cabeçalho (linha 0)
  return lines.slice(1).map(line => {
    const cols = splitCSVLine(line);

    const dia = cols[0]?.trim() ?? '';
    if (!dia) return null;

    return {
      dia:                 dia,
      gastoTotal:          parseVal(cols[1]),
      faturamentoTotal:    parseVal(cols[2]),
      gastoperiodo:        parseVal(cols[3]),
      faturamentoPeriodo:  parseVal(cols[4]),
      roiTotal:            parseVal(cols[5]),
      roiPeriodo:          parseVal(cols[6]),
      quantEnvios:         parseIntVal(cols[7]),
    };
  }).filter(Boolean);
}

// Divide uma linha CSV respeitando campos entre aspas
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
  // Remove R$, espaços, pontos de milhar e troca vírgula decimal por ponto
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
  const [error, setError]         = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [source, setSource]       = useState('local');

  useEffect(() => {
    if (!SHEETS_CSV_URL) {
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

        const res = await fetch(SHEETS_CSV_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

        const text = await res.text();
        const parsed = parseCSV(text);

        if (!parsed.length) throw new Error('Nenhum dado encontrado na planilha.');

        setData(parsed);
        setUpdatedAt(new Date().toISOString());
        setSource('sheets');
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message);
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
