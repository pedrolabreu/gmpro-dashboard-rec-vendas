// Formatters compartilhados pelo dashboard principal e pelas abas UTM/Reembolsos

export const fmt = (v) =>
  v == null || isNaN(v) ? '—' :
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtROI = (v) =>
  v == null || isNaN(v) || !isFinite(v) ? '—' : v.toFixed(1) + 'x';

export const fmtPct = (v) =>
  v == null || isNaN(v) ? '—' : v.toFixed(2) + '%';

export const formatTick = (v) => {
  if (v == null) return '';
  if (v >= 1000) return 'R$' + (v / 1000).toFixed(1) + 'k';
  return 'R$' + v;
};

export const maskEmail = (email) =>
  typeof email === 'string' && email.includes('@')
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '***' + c)
    : email;
