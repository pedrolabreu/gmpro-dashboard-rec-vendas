/**
 * GM Pro - Dashboard Recuperação de Vendas
 * Google Apps Script - Web App API
 *
 * Como usar:
 * 1. Abra seu Google Sheets
 * 2. Extensões > Apps Script
 * 3. Cole este código
 * 4. Clique em "Implantar" > "Nova implantação"
 * 5. Tipo: App da Web
 *    - Executar como: Eu mesmo
 *    - Quem tem acesso: Qualquer pessoa (anônimo)
 * 6. Copie a URL gerada e cole no dashboard (src/config.js)
 */

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────

var SHEET_NAME = 'Dashboard'; // Nome da aba com os dados
var HEADER_ROWS = 1;          // Quantidade de linhas de cabeçalho a ignorar

// Mapeamento de colunas (0 = coluna A, 1 = coluna B, ...)
var COL = {
  DIA:                  0, // A - Dia
  GASTO_TOTAL:          1, // B - Gasto Total
  FATURAMENTO_TOTAL:    2, // C - Faturamento Total
  GASTO_PERIODO:        3, // D - Gasto do Período
  FATURAMENTO_PERIODO:  4, // E - Faturamento do Período
  ROI_TOTAL:            5, // F - ROI Total
  ROI_PERIODO:          6, // G - ROI do Período
  QUANT_ENVIOS:         7, // H - Quantidade de Envios
};

// ─── API ─────────────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    var result = getDashboardData();
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── LEITURA DOS DADOS ───────────────────────────────────────────────────────

function getDashboardData() {
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();

  if (lastRow <= HEADER_ROWS) {
    return { data: [], updatedAt: new Date().toISOString(), totalRows: 0 };
  }

  var startRow = HEADER_ROWS + 1;
  var numRows  = lastRow - HEADER_ROWS;
  var numCols  = Object.keys(COL).length; // lê exatamente as colunas mapeadas

  var values = sheet.getRange(startRow, 1, numRows, numCols).getValues();
  var data   = [];

  for (var i = 0; i < values.length; i++) {
    var row = values[i];

    // Ignora linhas sem data
    if (!row[COL.DIA] || row[COL.DIA] === '') continue;

    data.push({
      dia:                 formatDate(row[COL.DIA]),
      gastoTotal:          parseVal(row[COL.GASTO_TOTAL]),
      faturamentoTotal:    parseVal(row[COL.FATURAMENTO_TOTAL]),
      gastoperiodo:        parseVal(row[COL.GASTO_PERIODO]),
      faturamentoPeriodo:  parseVal(row[COL.FATURAMENTO_PERIODO]),
      roiTotal:            parseVal(row[COL.ROI_TOTAL]),
      roiPeriodo:          parseVal(row[COL.ROI_PERIODO]),
      quantEnvios:         parseIntVal(row[COL.QUANT_ENVIOS]),
    });
  }

  return {
    data:      data,
    updatedAt: new Date().toISOString(),
    totalRows: data.length,
  };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error(
      'Aba "' + SHEET_NAME + '" não encontrada. ' +
      'Verifique o valor de SHEET_NAME no topo do script.'
    );
  }
  return sheet;
}

function formatDate(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  }
  return String(v).trim();
}

function parseVal(v) {
  if (v === '' || v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  // Trata erros de fórmula como #DIV/0!, #VALOR!, etc.
  if (typeof v === 'string' && v.startsWith('#')) return null;
  var str    = String(v).replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
  var parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

function parseIntVal(v) {
  if (v === '' || v === null || v === undefined) return 0;
  if (typeof v === 'number') return Math.round(v);
  if (typeof v === 'string' && v.startsWith('#')) return 0;
  var parsed = parseInt(String(v).trim(), 10);
  return isNaN(parsed) ? 0 : parsed;
}

// ─── TESTE ────────────────────────────────────────────────────────────────────

// Execute esta função no editor do Apps Script para validar antes de implantar
function testar() {
  var resultado = getDashboardData();
  Logger.log('✅ Total de linhas lidas: ' + resultado.totalRows);
  Logger.log('📅 Primeiro registro: ' + JSON.stringify(resultado.data[0]));
  Logger.log('📅 Último registro:   ' + JSON.stringify(resultado.data[resultado.data.length - 1]));
  Logger.log('🕒 Atualizado em:     ' + resultado.updatedAt);
}
