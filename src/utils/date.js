// Date helpers compartilhados pelo dashboard principal e pelas abas UTM/Reembolsos

// Aceita "dd/MM/yyyy" ou "yyyy-MM-dd" → Date
export function parseDate(str) {
  if (!str) return null;
  if (str.includes('/')) {
    const [d, m, y] = str.split('/');
    return new Date(+y, +m - 1, +d);
  }
  if (str.includes('-')) {
    const [y, m, d] = str.split('-');
    return new Date(+y, +m - 1, +d);
  }
  return null;
}

// Date → "yyyy-MM-dd" (valor do input[type=date])
// Usa componentes locais para evitar bug de fuso horário com toISOString()
export function toInputVal(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// "yyyy-MM-dd" → Date
export function fromInputVal(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-');
  return new Date(+y, +m - 1, +d);
}

export const PRESETS = [
  { label: 'Hoje',  type: 'today' },
  { label: 'Ontem', type: 'yesterday' },
  { label: '7d',    days: 7 },
  { label: '14d',   days: 14 },
  { label: '30d',   days: 30 },
  { label: 'Tudo',  days: null },
];
