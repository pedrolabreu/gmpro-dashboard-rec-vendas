import { GERAL_CSV_URL, GERAL_REFUNDS_CSV_URL } from '../config';
import { splitCSVLine, parseVal, parseIntVal } from '../utils/csv';
import { useSheetData } from './useSheetData';

// Colunas da planilha [GM PRO] SALES CONTROL (mesmo layout nas abas Geral e Reembolsos)
// A=Data B=Nome C=Email D=Telefone E=Gateway F=Produto G=Oferta H=Status I=Valor J=Tracking K=Operação
// Valor normalmente vem em centavos sem separador (ex: 24948 = R$ 249,48). A
// fórmula da operação Pedro / gateway Dom Pagamentos lança o valor já em reais
// (ex: 247 = R$ 247,00; 306,6 = R$ 306,60, vírgula = centavos) — até ser
// corrigida na fonte, tratamos esses casos sem dividir por 100.
const VALOR_JA_EM_REAIS = { gateway: 'dom pagamentos', operacao: 'pedro' };

function parseValorCol(raw, gateway, operacao) {
  const v = (raw ?? '').trim();
  if (!v) return 0;
  const jaEmReais =
    gateway.toLowerCase()  === VALOR_JA_EM_REAIS.gateway ||
    operacao.toLowerCase() === VALOR_JA_EM_REAIS.operacao;
  return jaEmReais ? parseVal(v) : parseIntVal(v) / 100;
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  return lines.slice(1).map(line => {
    const cols = splitCSVLine(line);
    const data = cols[0]?.trim() ?? '';
    if (!data) return null;

    const gateway  = cols[4]?.trim() ?? '';
    const operacao = cols[10]?.trim() ?? '';

    return {
      data:     data,
      nome:     cols[1]?.trim() ?? '',
      email:    cols[2]?.trim() ?? '',
      telefone: cols[3]?.trim() ?? '',
      gateway:  gateway,
      produto:  cols[5]?.trim() ?? '',
      oferta:   cols[6]?.trim() ?? '',
      status:   cols[7]?.trim() ?? '',
      valor:    parseValorCol(cols[8], gateway, operacao),
      tracking: cols[9]?.trim() ?? '',
      operacao: operacao,
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
