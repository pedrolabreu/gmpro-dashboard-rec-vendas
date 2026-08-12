import { useCallback, useMemo } from 'react';
import { ENVIOS_CSV_URL, TIPO_CUSTO_MAP } from '../config';
import { splitCSVLine } from '../utils/csv';
import { parseDate } from '../utils/date';
import { useSheetData } from './useSheetData';

// Normaliza o tipo: minúsculo, substitui hífen/espaço por underscore
function normalizeTipo(s) {
  return (s ?? '').trim().toLowerCase().replace(/[-\s]/g, '_');
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  return lines.slice(1).map(line => {
    const cols = splitCSVLine(line);
    const data = cols[0]?.trim() ?? '';
    if (!data) return null;
    // Colunas: A=Data  B=Email  C=Telefone  D=Registro  E=Tipo
    return {
      data,
      email:    (cols[1] ?? '').trim().toLowerCase(),
      telefone: (cols[2] ?? '').replace(/\D/g, ''),
      tipo:     normalizeTipo(cols[4]), // col E normalizada
    };
  }).filter(Boolean);
}

export function useEnviosData() {
  const { data, loading, error } = useSheetData(ENVIOS_CSV_URL, parseCSV);

  // Conta envios filtrados por tipo e intervalo de datas
  const countEnvios = useCallback((tipo, from, to) => {
    const tipoNorm = normalizeTipo(tipo);
    return data.filter(r => {
      if (tipoNorm && r.tipo !== tipoNorm) return false;
      const d = parseDate(r.data);
      if (!d) return false;
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      return true;
    }).length;
  }, [data]);

  // Calcula gasto total para um intervalo, aplicando custo por tipo
  // Se tipo fornecido: filtra só aquele tipo; senão, soma todos os tipos
  const calcGasto = useCallback((tipo, from, to) => {
    const tipoNorm = normalizeTipo(tipo);
    return data.reduce((sum, r) => {
      if (tipoNorm && r.tipo !== tipoNorm) return sum;
      const d = parseDate(r.data);
      if (!d) return sum;
      if (from && d < from) return sum;
      if (to   && d > to)   return sum;
      const custo = TIPO_CUSTO_MAP[r.tipo] ?? 0;
      return sum + custo;
    }, 0);
  }, [data]);

  // Tipos únicos encontrados no sheet (útil para debug)
  const tiposUnicos = useMemo(() => [...new Set(data.map(r => r.tipo))], [data]);

  return { data, loading, error, countEnvios, calcGasto, tiposUnicos };
}
