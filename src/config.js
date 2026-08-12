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
  'Strong Base - Segunda Força - REC': 'recuperacao',
  'Strong Base - Segunda Força':       'recuperacao',
  'Strong Pump - REC':                 'segunda_tentativa',
  'Strong Pump':                       'segunda_tentativa',
};

// Resolve o tipo de envio a partir do nome do produto.
// Tolerante a sufixos como "- REC" e a novas variações de nome: se não houver
// correspondência exata no mapa, cai para uma checagem por palavra-chave.
export function resolveTipoEnvio(produto) {
  if (!produto) return null;
  if (PRODUTO_TIPO_MAP[produto]) return PRODUTO_TIPO_MAP[produto];
  const p = produto.toLowerCase();
  if (p.includes('strong base')) return 'recuperacao';
  if (p.includes('strong pump')) return 'segunda_tentativa';
  return null;
}

// Custo por envio conforme o tipo
export const TIPO_CUSTO_MAP = {
  'recuperacao':       1.11,
  'segunda_tentativa': 0.37,
};

// Canais de recuperação (segmentação do tipo). As chaves usam a forma
// normalizada (minúsculo, separadores como "_"). Rótulo e cor de cada canal;
// canais novos que aparecerem na planilha entram automaticamente no funil com
// um rótulo derivado do próprio nome.
export const CANAIS_LABEL = {
  'recuperacao':                'Recuperação',
  'segunda_tentativa':          'Segunda Tentativa',
  'recuperacao_popup_myads':    'Pop-up MyAds',
  'recuperacao_popup_aurelio':  'Pop-up Aurélio',
  'recuperacao_popup_smd':      'Pop-up SMD',
};

export const CANAIS_COR = {
  'recuperacao':                '#cc0000',
  'segunda_tentativa':          '#f59e0b',
  'recuperacao_popup_myads':    '#3b82f6',
  'recuperacao_popup_aurelio':  '#a855f7',
  'recuperacao_popup_smd':      '#4ade80',
};

// Paleta de fallback para canais não mapeados acima
export const CANAIS_COR_FALLBACK = ['#22d3ee', '#eab308', '#ec4899', '#14b8a6', '#f97316'];

// Normaliza um tipo/canal: minúsculo, sem acento de espaços, separadores -> "_"
export function normalizeCanal(s) {
  return (s ?? '').trim().toLowerCase().replace(/[-\s]+/g, '_');
}

// Rótulo amigável de um canal normalizado (usa o mapa ou deriva do nome)
export function canalLabel(tipo) {
  if (CANAIS_LABEL[tipo]) return CANAIS_LABEL[tipo];
  if (!tipo) return '(sem tipo)';
  return tipo
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Metas de faturamento do mês (Recuperação de Vendas)
// Ordem crescente: Mínima → Regular → Super
export const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Metas por mês (chave "AAAA-MM"). Para incluir um novo mês, basta adicionar
// uma nova entrada aqui com os três valores — o dashboard segue o mês atual
// automaticamente.
export const METAS_POR_MES = {
  '2026-07': [
    { key: 'minima',  label: 'Mínima',  valor: 33915.00,  cor: '#f59e0b' },
    { key: 'regular', label: 'Regular', valor: 59500.00,  cor: '#3b82f6' },
    { key: 'super',   label: 'Super',   valor: 135000.00, cor: '#4ade80' },
  ],
  '2026-08': [
    { key: 'minima',  label: 'Mínima',  valor: 55250.00, cor: '#f59e0b' },
    { key: 'regular', label: 'Regular', valor: 68000.00, cor: '#3b82f6' },
    { key: 'super',   label: 'Super',   valor: 89250.00, cor: '#4ade80' },
  ],
};

const mesKey = (ano, mes) => `${ano}-${String(mes + 1).padStart(2, '0')}`;

// Resolve o mês de meta a exibir: usa o mês atual se houver metas cadastradas;
// senão, cai para o mês cadastrado mais recente que já começou.
export function resolveMetaMes(hoje = new Date()) {
  const keyAtual = mesKey(hoje.getFullYear(), hoje.getMonth());
  let ano = hoje.getFullYear();
  let mes = hoje.getMonth();

  if (!METAS_POR_MES[keyAtual]) {
    const keys = Object.keys(METAS_POR_MES).sort();
    const anteriores = keys.filter(k => k <= keyAtual);
    const escolhida = anteriores.length ? anteriores[anteriores.length - 1] : keys[keys.length - 1];
    if (escolhida) {
      const [a, m] = escolhida.split('-');
      ano = +a;
      mes = +m - 1;
    }
  }

  return {
    ano,
    mes,
    label: MESES_PT[mes],
    metas: METAS_POR_MES[mesKey(ano, mes)] || [],
  };
}
