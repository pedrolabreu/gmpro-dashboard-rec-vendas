export const SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1vI66AYn6y_hdd2XFsYeUm2vrAMSdHaE6eOu5C9B0zyc/export?format=csv&gid=0';

export const UTM_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1vI66AYn6y_hdd2XFsYeUm2vrAMSdHaE6eOu5C9B0zyc/export?format=csv&gid=1951142666';

export const REFUNDS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1vI66AYn6y_hdd2XFsYeUm2vrAMSdHaE6eOu5C9B0zyc/export?format=csv&gid=1344779198';

export const ENVIOS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1vI66AYn6y_hdd2XFsYeUm2vrAMSdHaE6eOu5C9B0zyc/export?format=csv&gid=978563818';

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
