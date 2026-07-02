import { useMemo } from 'react';
import {
  ComposedChart, Area, Line, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label,
} from 'recharts';
import { Target } from 'lucide-react';
import { METAS, META_MES } from '../config';
import { parseDate } from '../utils/date';
import { fmt, formatTick } from '../utils/format';
import ChartTooltip from './ChartTooltip';

const fmtMeta = (name, value) => fmt(value);

// Componente de acompanhamento de metas do mês (Mínima / Regular / Super)
export default function MetaProgress({ data }) {
  // Filtra somente os dias do mês/ano de referência e acumula o faturamento
  const { realizado, chartData, diasComDado } = useMemo(() => {
    const doMes = data
      .filter(row => {
        const d = parseDate(row.dia);
        return d && d.getFullYear() === META_MES.ano && d.getMonth() === META_MES.mes;
      })
      .sort((a, b) => parseDate(a.dia) - parseDate(b.dia));

    const chart = doMes.reduce((arr, row) => {
      const diario = row.faturamentoPeriodo || 0;
      const anterior = arr.length ? arr[arr.length - 1].acumulado : 0;
      arr.push({
        label: row.dia.slice(0, 5),
        diario,
        acumulado: anterior + diario,
      });
      return arr;
    }, []);

    const total = chart.length ? chart[chart.length - 1].acumulado : 0;
    return { realizado: total, chartData: chart, diasComDado: doMes.length };
  }, [data]);

  const maiorMeta = METAS[METAS.length - 1].valor;

  return (
    <div className="meta-section">
      <div className="chart-title" style={{ marginBottom: 18 }}>
        <span className="chart-title-dot" />
        <Target size={14} style={{ color: '#cc0000' }} />
        Metas de {META_MES.label} — Faturamento
      </div>

      {/* CARDS DE META COM BARRA DE % */}
      <div className="meta-grid">
        {METAS.map(meta => {
          const pct = meta.valor > 0 ? (realizado / meta.valor) * 100 : 0;
          const pctClamp = Math.min(pct, 100);
          const batida = realizado >= meta.valor;
          const falta = Math.max(meta.valor - realizado, 0);
          return (
            <div key={meta.key} className={`meta-card ${batida ? 'meta-batida' : ''}`}>
              <div className="meta-card-head">
                <span className="meta-card-label" style={{ color: meta.cor }}>
                  {meta.label}
                </span>
                <span className="meta-card-pct" style={{ color: meta.cor }}>
                  {pct.toFixed(1)}%
                </span>
              </div>
              <div className="meta-card-alvo">{fmt(meta.valor)}</div>
              <div className="meta-bar-track">
                <div
                  className="meta-bar-fill"
                  style={{ width: `${pctClamp}%`, background: meta.cor }}
                />
              </div>
              <div className="meta-card-foot">
                {batida
                  ? <span style={{ color: meta.cor }}>✓ Meta batida</span>
                  : <span>Faltam {fmt(falta)}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* RESUMO REALIZADO */}
      <div className="meta-realizado-bar">
        <span className="meta-realizado-label">Realizado no mês</span>
        <span className="meta-realizado-valor">{fmt(realizado)}</span>
        <span className="meta-realizado-sub">
          {diasComDado} {diasComDado === 1 ? 'dia' : 'dias'} com registro
        </span>
      </div>

      {/* GRÁFICO ACUMULADO DIA A DIA VS METAS */}
      <div className="chart-card full" style={{ marginTop: 18 }}>
        <div className="chart-title">
          <span className="chart-title-dot" />Meta vs Realizado — Acumulado dia a dia
        </div>
        <div className="chart-legend">
          <div className="legend-item"><div className="legend-dot" style={{ background: '#cc0000' }} />Realizado acumulado</div>
          {METAS.map(m => (
            <div className="legend-item" key={m.key}>
              <div className="legend-dot" style={{ background: m.cor }} />{m.label}
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="metaRealGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#cc0000" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#cc0000" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis dataKey="label" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis
              tickFormatter={formatTick}
              tick={{ fill: '#444', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, Math.max(maiorMeta * 1.05, realizado * 1.05)]}
            />
            <Tooltip content={<ChartTooltip formatValue={fmtMeta} />} />
            {METAS.map(meta => (
              <ReferenceLine
                key={meta.key}
                y={meta.valor}
                stroke={meta.cor}
                strokeDasharray="5 4"
                strokeWidth={1.5}
                ifOverflow="extendDomain"
              >
                <Label
                  value={meta.label}
                  position="right"
                  fill={meta.cor}
                  fontSize={10}
                  fontWeight={600}
                />
              </ReferenceLine>
            ))}
            <Area
              type="monotone"
              dataKey="acumulado"
              name="Realizado acumulado"
              stroke="#cc0000"
              fill="url(#metaRealGrad)"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="diario"
              name="Faturamento do dia"
              stroke="#555"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 2"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
