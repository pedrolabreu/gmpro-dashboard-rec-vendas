import { GERAL_CSV_URL, GERAL_REFUNDS_CSV_URL } from '../config';
import { splitCSVLine, parseIntVal } from '../utils/csv';
import { useSheetData } from './useSheetData';

// Colunas da planilha [GM PRO] SALES CONTROL (mesmo layout nas abas Geral e Reembolsos)
// A=Data B=Nome C=Email D=Telefone E=Gateway F=Produto G=Oferta H=Status I=Valor J=Tracking K=Operação
// Valor vem em centavos (ex: 24948 = R$ 249,48)
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  return lines.slice(1).map(line => {
    const cols = splitCSVLine(line);
    const data = cols[0]?.trim() ?? '';
    if (!data) return null;

    return {
      data:     data,
      nome:     cols[1]?.trim() ?? '',
      email:    cols[2]?.trim() ?? '',
      telefone: cols[3]?.trim() ?? '',
      gateway:  cols[4]?.trim() ?? '',
      produto:  cols[5]?.trim() ?? '',
      oferta:   cols[6]?.trim() ?? '',
      status:   cols[7]?.trim() ?? '',
      valor:    parseIntVal(cols[8]) / 100,
      tracking: cols[9]?.trim() ?? '',
      operacao: cols[10]?.trim() ?? '',
    };
  }).filter(Boolean);
}

export function useGeralSalesData() {
  return useSheetData(GERAL_CSV_URL, parseCSV, {
    emptyError: 'Nenhuma venda encontrada na planilha Geral.',
  });
}

export function useGeralRefundData() {
  return useSheetData(GERAL_REFUNDS_CSV_URL, parseCSV, {
    emptyError: 'Nenhum reembolso encontrado na planilha Geral.',
  });
}
