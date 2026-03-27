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

// Configuração: nome da aba com os dados
var SHEET_NAME = 'Dashboard'; // Altere se sua aba tiver outro nome

function doGet(e) {
  try {
    var data = getDashboardData();
    var output = ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
    return addCorsHeaders(output);
  } catch (err) {
    var error = ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
    return addCorsHeaders(error);
  }
}

function addCorsHeaders(output) {
  // Permite que o dashboard acesse a API de qualquer origem
  return output;
}

function getDashboardData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error('Aba "' + SHEET_NAME + '" não encontrada. Verifique o nome da aba no script.');
  }

  var lastRow = sheet.getLastRow();

  // Ignora linha 1 (cabeçalho), lê a partir da linha 2
  if (lastRow < 2) {
    return { data: [], updatedAt: new Date().toISOString() };
  }

  // Lê todas as colunas de uma vez (A até H)
  var range = sheet.getRange(2, 1, lastRow - 1, 8);
  var values = range.getValues();

  var data = [];

  for (var i = 0; i < values.length; i++) {
    var row = values[i];

    // Ignora linhas vazias (sem data)
    if (!row[0] || row[0] === '') continue;

    // Formata a data
    var dia = '';
    if (row[0] instanceof Date) {
      dia = Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'dd/MM/yyyy');
    } else {
      dia = String(row[0]);
    }

    // Converte valores, tratando células vazias e erros (#DIV/0!, etc.)
    var entry = {
      dia:                  dia,
      gastoTotal:           parseVal(row[1]),
      faturamentoTotal:     parseVal(row[2]),
      gastoperiodo:         parseVal(row[3]),
      faturamentoPeriodo:   parseVal(row[4]),
      roiTotal:             parseVal(row[5]),
      roiPeriodo:           parseVal(row[6]),
      quantEnvios:          parseIntVal(row[7]),
    };

    data.push(entry);
  }

  return {
    data: data,
    updatedAt: new Date().toISOString(),
    totalRows: data.length,
  };
}

function parseVal(v) {
  if (v === '' || v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  // Remove R$, espaços e troca vírgula por ponto
  var str = String(v).replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
  var parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

function parseIntVal(v) {
  if (v === '' || v === null || v === undefined) return 0;
  if (typeof v === 'number') return Math.round(v);
  var parsed = parseInt(String(v).trim(), 10);
  return isNaN(parsed) ? 0 : parsed;
}

// Função auxiliar para testar no editor do Apps Script
function testar() {
  var resultado = getDashboardData();
  Logger.log('Total de linhas: ' + resultado.totalRows);
  Logger.log('Primeiro registro: ' + JSON.stringify(resultado.data[0]));
  Logger.log('Último registro: ' + JSON.stringify(resultado.data[resultado.data.length - 1]));
}
