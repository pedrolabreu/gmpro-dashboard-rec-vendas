// Parsing helpers compartilhados por todos os hooks que consomem CSV do Google Sheets

export function splitCSVLine(line) {
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

export function parseVal(v) {
  if (!v || v.trim() === '' || v.startsWith('#')) return 0;
  const str = v.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

// Igual a parseVal mas preserva valores negativos (ex: -R$ 6,23)
export function parseValSigned(v) {
  if (!v || v.trim() === '' || v.startsWith('#')) return 0;
  const negative = v.trim().startsWith('-');
  const str = v.replace(/-/g, '').replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
  const n = parseFloat(str);
  if (isNaN(n)) return 0;
  return negative ? -n : n;
}

export function parseIntVal(v) {
  if (!v || v.trim() === '' || v.startsWith('#')) return 0;
  const n = parseInt(v.trim(), 10);
  return isNaN(n) ? 0 : n;
}

// Normaliza nome de coluna: minúsculas, sem acento, sem espaço
export function normalizeKey(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}
