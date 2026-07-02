export const SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1vI66AYn6y_hdd2XFsYeUm2vrAMSdHaE6eOu5C9B0zyc/export?format=csv&gid=0';

export const UTM_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1vI66AYn6y_hdd2XFsYeUm2vrAMSdHaE6eOu5C9B0zyc/export?format=csv&gid=1951142666';

export const REFUNDS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1vI66AYn6y_hdd2XFsYeUm2vrAMSdHaE6eOu5C9B0zyc/export?format=csv&gid=1344779198';

export const ENVIOS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1vI66AYn6y_hdd2XFsYeUm2vrAMSdHaE6eOu5C9B0zyc/export?format=csv&gid=978563818';

// Planilha [GM PRO] SALES CONTROL — fonte de dados da estrutura "Geral"
export const GERAL_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1H7pagcA8a9uyerxOCEXu3XNs0GS1gXYC4raQqC8k5WI/export?format=csv&gid=66870694';

export const GERAL_REFUNDS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1H7pagcA8a9uyerxOCEXu3XNs0GS1gXYC4raQqC8k5WI/export?format=csv&gid=259158503';

// Mapeamento produto → tipo de envio na aba Envios - Recuperação
export const PRODUTO_TIPO_MAP = {
  'Strong Base - Segunda Força': 'recuperacao',
  'Strong Pump': 'segunda_tentativa',
};

// Custo por envio conforme o tipo
export const TIPO_CUSTO_MAP = {
  'recuperacao':       1.11,
  'segunda_tentativa': 0.37,
};

// Metas de faturamento do mês (Recuperação de Vendas)
// Ordem crescente: Mínima → Regular → Super
export const METAS = [
  { key: 'minima',  label: 'Mínima',  valor: 33702.02, cor: '#f59e0b' },
  { key: 'regular', label: 'Regular', valor: 42127.52, cor: '#3b82f6' },
  { key: 'super',   label: 'Super',   valor: 59474.15, cor: '#4ade80' },
];

// Mês de referência para o acompanhamento de metas (0 = Janeiro … 6 = Julho)
export const META_MES = { ano: 2026, mes: 6, label: 'Julho' };
