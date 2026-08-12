import { useMemo } from 'react';
import { Filter } from 'lucide-react';
import { parseDate } from '../utils/date';
import { fmtPct } from '../utils/format';
import {
  CANAIS_COR, CANAIS_COR_FALLBACK, canalLabel, normalizeCanal,
} from '../config';

// Funil por segmentação de canal:
//   Topo  = envios (quantas pessoas entraram com aquele tipo)
//   Fundo = vendas atribuídas àquele canal
// A segmentação de vendas é detectada automaticamente entre utm_medium e
// utm_term (o campo que mais casar com os tipos da planilha de Envios).
export default function FunnelSegmentacao({ enviosData, vendasData, from, to }) {
  const { canais, campoVendas } = useMemo(() => {
    const inRange = (dataStr) => {
      const d = parseDate(dataStr);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };

    // Envios agrupados por tipo (topo do funil)
    const enviosPorTipo = {};
    enviosData.forEach(r => {
      if (!inRange(r.data)) return;
      const t = normalizeCanal(r.tipo);
      if (!t) return;
      enviosPorTipo[t] = (enviosPorTipo[t] || 0) + 1;
    });

    // Vendas no período
    const vendasPeriodo = vendasData.filter(r => inRange(r.data));
    const tiposConhecidos = new Set(Object.keys(enviosPorTipo));

    // Detecta qual campo de UTM carrega a segmentação (o que mais casa)
    const matches = (campo) =>
      vendasPeriodo.reduce((n, r) => tiposConhecidos.has(normalizeCanal(r[campo])) ? n + 1 : n, 0);
    const nMedium = matches('utmMedium');
    const nTerm = matches('utmTerm');
    const campoVendas = nTerm > nMedium ? 'utmTerm' : 'utmMedium';

    // Vendas agrupadas pelo canal detectado (fundo do funil)
    const vendasPorTipo = {};
    vendasPeriodo.forEach(r => {
      const t = normalizeCanal(r[campoVendas]);
      if (!t) return;
      vendasPorTipo[t] = (vendasPorTipo[t] || 0) + 1;
    });

    // Une todos os tipos vistos (envios ∪ vendas), ordena por envios desc
    const todos = new Set([...Object.keys(enviosPorTipo), ...Object.keys(vendasPorTipo)]);
    let idxFallback = 0;
    const canais = [...todos].map(tipo => {
      const cor = CANAIS_COR[tipo] || CANAIS_COR_FALLBACK[idxFallback++ % CANAIS_COR_FALLBACK.length];
      const envios = enviosPorTipo[tipo] || 0;
      const vendas = vendasPorTipo[tipo] || 0;
      return {
        tipo,
        label: canalLabel(tipo),
        cor,
        envios,
        vendas,
        conversao: envios > 0 ? (vendas / envios) * 100 : 0,
      };
    }).sort((a, b) => b.envios - a.envios || b.vendas - a.vendas);

    return { canais, campoVendas };
  }, [enviosData, vendasData, from, to]);

  const totalEnvios = canais.reduce((s, c) => s + c.envios, 0);
  const totalVendas = canais.reduce((s, c) => s + c.vendas, 0);
  const maxEnvios = canais.reduce((m, c) => Math.max(m, c.envios), 0);

  if (!canais.length) return null;

  return (
    <div className="funnel-section">
      <div className="chart-title" style={{ marginBottom: 4 }}>
        <span className="chart-title-dot" />
        <Filter size={14} style={{ color: '#cc0000' }} />
        Funil por Segmentação de Canal
      </div>
      <div className="funnel-sub">
        Topo: entraram (envios) · Fundo: vendas ·{' '}
        {totalEnvios.toLocaleString('pt-BR')} envios → {totalVendas.toLocaleString('pt-BR')} vendas
        {' '}· vendas por <code>{campoVendas === 'utmTerm' ? 'utm_term' : 'utm_medium'}</code>
      </div>

      <div className="funnel-grid">
        {canais.map(c => {
          // Largura do topo proporcional ao maior canal; fundo proporcional à conversão
          const topoW = maxEnvios > 0 ? Math.max((c.envios / maxEnvios) * 100, c.envios > 0 ? 12 : 0) : 0;
          const fundoPctDoTopo = Math.min(Math.max(c.conversao, c.vendas > 0 ? 8 : 0), 100);
          const fundoW = c.envios > 0 ? topoW * (fundoPctDoTopo / 100) : 0;
          return (
            <div key={c.tipo} className="funnel-card">
              <div className="funnel-card-head">
                <span className="funnel-card-label" style={{ color: c.cor }}>{c.label}</span>
                <span className="funnel-conv" style={{ color: c.cor }}>{fmtPct(c.conversao)}</span>
              </div>

              {/* TOPO — entraram (envios) */}
              <div className="funnel-stage">
                <div
                  className="funnel-bar funnel-top"
                  style={{ width: `${topoW}%`, background: c.cor }}
                >
                  <span className="funnel-bar-val">{c.envios.toLocaleString('pt-BR')}</span>
                </div>
                <span className="funnel-stage-tag">Entraram</span>
              </div>

              {/* FUNDO — vendas */}
              <div className="funnel-stage">
                <div
                  className="funnel-bar funnel-bottom"
                  style={{ width: `${fundoW}%`, background: c.cor }}
                >
                  <span className="funnel-bar-val">{c.vendas.toLocaleString('pt-BR')}</span>
                </div>
                <span className="funnel-stage-tag">Vendas</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
