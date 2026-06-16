import { UTM_CSV_URL } from '../config';
import { splitCSVLine, parseVal } from '../utils/csv';
import { useSheetData } from './useSheetData';

// Detecta se coluna C (oculta no Sheets) está presente no CSV
// Se cols[3] começa com R$ → layout 6 colunas (A B C_oculta D E F)
// Caso contrário → layout 5 colunas (A B D E F)
function getIndices(cols) {
  const c3 = cols[3]?.trim() ?? '';
  const c2 = cols[2]?.trim() ?? '';
  if (c3.startsWith('R$') || c3.replace(/[^0-9]/g, '').length > 0 && !c2.startsWith('R$')) {
    return { valorIdx: 3, termIdx: 4, mediumIdx: 5, produtoIdx: 7 };
  }
  return { valorIdx: 2, termIdx: 3, mediumIdx: 4, produtoIdx: 6 };
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
    const { valorIdx, termIdx, mediumIdx, produtoIdx } = indices;

    return {
      data:      data,
      email:     cols[1]?.trim() ?? '',
      valor:     parseVal(cols[valorIdx]),
      utmTerm:   cols[termIdx]?.trim() ?? '',
      utmMedium: cols[mediumIdx]?.trim() ?? '',
      produto:   cols[produtoIdx]?.trim() ?? '',
    };
  }).filter(Boolean);
}

export function useUtmData() {
  return useSheetData(UTM_CSV_URL, parseCSV, {
    emptyError: 'Nenhuma venda encontrada na planilha.',
  });
}
