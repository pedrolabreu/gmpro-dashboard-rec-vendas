import { useMemo } from 'react';
import { Filter } from 'lucide-react';
import { parseDate } from '../utils/date';
import { fmtPct } from '../utils/format';
import {
  BUCKETS, CANAIS_COR, bucketCanal, canalLabel, normalizeCanal,
} from '../config';

// Funil por segmentação de canal (4 buckets fixos):
//   Topo  = envios (quantas pessoas entraram com aquele tipo)
//   Fundo = vendas atribuídas àquele canal
// A venda é atribuída ao canal cruzando o e-mail da venda com o e-mail do
// envio (fonte mais confiável). Se o cruzamento por e-mail render pouco, cai
// para o campo de UTM (medium/term) que mais casar com os tipos de envio.
// "Recuperação" é o catch-all (tudo que não for os outros 3).
export default function FunnelSegmentacao({ enviosData, vendasData, from, to }) {
  const { canais, metodo, totalEnvios, totalVendas, maxEnvios } = useMemo(() => {
    const inRange = (dataStr) => {
      const d = parseDate(dataStr);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };

    // Envios agrupados por bucket (topo do funil)
    const enviosPorBucket = {};
    // Tipos de envio conhecidos (para validar o fallback por UTM)
    const tiposEnvio = new Set();
    // Mapa e-mail → tipo do envio mais recente (independe do período)
    const emailToTipo = new Map();
    const emailToData = new Map();

    enviosData.forEach(r => {
      const t = normalizeCanal(r.tipo);
      if (t) tiposEnvio.add(t);

      if (inRange(r.data)) {
        const b = bucketCanal(r.tipo);
        if (b) enviosPorBucket[b] = (enviosPorBucket[b] || 0) + 1;
      }

      const email = (r.email ?? '').trim().toLowerCase();
      if (email && t) {
        const d = parseDate(r.data);
        const prev = emailToData.get(email);
        if (!prev || (d && d >= prev)) {
          emailToData.set(email, d);
          emailToTipo.set(email, t);
        }
      }
    });

    // Vendas no período
    const vendasPeriodo = vendasData.filter(r => inRange(r.data));

    // Candidatos de atribuição do canal de uma venda → tipo de envio
    const tipoPorEmail = (r) => emailToTipo.get((r.email ?? '').trim().toLowerCase());
    const tipoPorCampo = (campo) => (r) => {
      const t = normalizeCanal(r[campo]);
      return tiposEnvio.has(t) ? t : undefined;
    };
    const candidatos = [
      { metodo: 'e-mail',     resolver: tipoPorEmail },
      { metodo: 'utm_medium', resolver: tipoPorCampo('utmMedium') },
      { metodo: 'utm_term',   resolver: tipoPorCampo('utmTerm') },
    ];
    // Escolhe o método que atribui mais vendas a um canal conhecido
    const pontuar = (resolver) => vendasPeriodo.reduce((n, r) => (resolver(r) ? n + 1 : n), 0);
    const escolhido = candidatos
      .map(c => ({ ...c, pontos: pontuar(c.resolver) }))
      .sort((a, b) => b.pontos - a.pontos)[0];

    // Vendas agrupadas por bucket (fundo do funil)
    const vendasPorBucket = {};
    vendasPeriodo.forEach(r => {
      const tipo = escolhido.resolver(r);
      if (!tipo) return;
      const b = bucketCanal(tipo);
      if (b) vendasPorBucket[b] = (vendasPorBucket[b] || 0) + 1;
    });

    // Monta os 4 buckets fixos na ordem definida
    const canais = BUCKETS.map(b => {
      const envios = enviosPorBucket[b] || 0;
      const vendas = vendasPorBucket[b] || 0;
      return {
        bucket: b,
        label: canalLabel(b),
        cor: CANAIS_COR[b],
        envios,
        vendas,
        conversao: envios > 0 ? (vendas / envios) * 100 : 0,
      };
    });

    return {
      canais,
      metodo: escolhido.metodo,
      totalEnvios: canais.reduce((s, c) => s + c.envios, 0),
      totalVendas: canais.reduce((s, c) => s + c.vendas, 0),
      maxEnvios: canais.reduce((m, c) => Math.max(m, c.envios), 0),
    };
  }, [enviosData, vendasData, from, to]);

  if (!totalEnvios && !totalVendas) return null;

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
        {' '}· vendas atribuídas por <code>{metodo}</code>
      </div>

      <div className="funnel-grid">
        {canais.map(c => {
          // Topo proporcional ao maior canal; fundo proporcional à conversão
          const topoW = maxEnvios > 0 ? Math.max((c.envios / maxEnvios) * 100, c.envios > 0 ? 12 : 0) : 0;
          const fundoPctDoTopo = Math.min(Math.max(c.conversao, c.vendas > 0 ? 8 : 0), 100);
          const fundoW = c.envios > 0 ? topoW * (fundoPctDoTopo / 100) : 0;
          return (
            <div key={c.bucket} className="funnel-card">
              <div className="funnel-card-head">
                <span className="funnel-card-label" style={{ color: c.cor }}>{c.label}</span>
                <span className="funnel-conv" style={{ color: c.cor }}>{fmtPct(c.conversao)}</span>
              </div>

              {/* TOPO — entraram (envios) */}
              <div className="funnel-stage">
                <div className="funnel-bar funnel-top" style={{ width: `${topoW}%`, background: c.cor }}>
                  <span className="funnel-bar-val">{c.envios.toLocaleString('pt-BR')}</span>
                </div>
                <span className="funnel-stage-tag">Entraram</span>
              </div>

              {/* FUNDO — vendas */}
              <div className="funnel-stage">
                <div className="funnel-bar funnel-bottom" style={{ width: `${fundoW}%`, background: c.cor }}>
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
