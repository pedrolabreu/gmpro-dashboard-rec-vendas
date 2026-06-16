import { REFUNDS_CSV_URL } from '../config';
import { splitCSVLine, parseVal, normalizeKey } from '../utils/csv';
import { useSheetData } from './useSheetData';

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

    return {
      data:    dataIdx  >= 0 ? (cols[dataIdx]?.trim()  ?? '') : (cols[0]?.trim() ?? ''),
      email:   emailIdx >= 0 ? (cols[emailIdx]?.trim() ?? '') : (cols[1]?.trim() ?? ''),
      valor:   valorIdx >= 0 ? parseVal(cols[valorIdx])       : parseVal(cols[2]),
      motivo:  motivoIdx  >= 0 ? (cols[motivoIdx]?.trim()  ?? '') : '',
      produto: produtoIdx >= 0 ? (cols[produtoIdx]?.trim() ?? '') : '',
      // guarda todas as colunas para exibição completa na tabela
      _raw: cols.map(c => c?.trim() ?? ''),
    };
  }).filter(Boolean);

  return { headers, rows };
}

export function useRefundData() {
  const { data, loading, refreshing, error, updatedAt, refetch } = useSheetData(
    REFUNDS_CSV_URL, parseCSV,
    {
      initialData: { headers: [], rows: [] },
      isEmpty: (parsed) => parsed.rows.length === 0,
      emptyError: 'Nenhum reembolso encontrado na planilha.',
    }
  );

  return { rows: data.rows, headers: data.headers, loading, refreshing, error, updatedAt, refetch };
}
