import { useState, useMemo } from 'react';
import { useRefundData } from '../hooks/useRefundData';
import { useDateRangeFilter } from '../hooks/useDateRangeFilter';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line,
} from 'recharts';
import { RefreshCw, AlertCircle, DollarSign, RotateCcw, Tag } from 'lucide-react';
import { parseDate, fromInputVal } from '../utils/date';
import { fmt, formatTick, maskEmail } from '../utils/format';
import ChartTooltip from './ChartTooltip';
import { ProductFilter, PeriodFilter } from './FilterBar';

const formatTooltipValue = (name, value) => (name === 'Valor' ? fmt(value) : value);

const COLORS = ['#cc0000', '#ff3333', '#ff6666', '#ff9999', '#ffcccc'];

function aggregateBy(rows, key) {
  const map = {};
  rows.forEach(r => {
    const k = r[key] || '(vazio)';
    if (!map[k]) map[k] = { name: k, count: 0, valor: 0 };
    map[k].count += 1;
    map[k].valor += r.valor;
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
}

function groupByDate(rows) {
  const map = {};
  rows.forEach(r => {
    const k = r.data?.slice(0, 5) || '—';
    if (!map[k]) map[k] = { label: k, count: 0, valor: 0 };
    map[k].count += 1;
    map[k].valor += r.valor;
  });
  return Object.values(map);
}

export default function RefundsDashboard() {
  const { rows: allRows, headers, loading, refreshing, error, updatedAt, refetch } = useRefundData();

  const [produtoFiltro, setProdutoFiltro] = useState('Todos');
  const { activePreset, startDate, endDate, applyPreset, handleDateChange, clear } = useDateRangeFilter();

  const produtos = useMemo(() => {
    const set = new Set(allRows.map(r => r.produto).filter(Boolean));
    return set.size > 0 ? ['Todos', ...Array.from(set).sort()] : [];
  }, [allRows]);

  const rows = useMemo(() => {
    if (!allRows.length) return [];
    const from = startDate ? fromInputVal(startDate) : null;
    const to   = endDate   ? fromInputVal(endDate)   : null;
    return allRows.filter(r => {
      const d = parseDate(r.data);
      if (!d) return false;
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      if (produtoFiltro !== 'Todos' && r.produto !== produtoFiltro) return false;
      return true;
    });
  }, [allRows, startDate, endDate, produtoFiltro]);

  const totalValor   = useMemo(() => rows.reduce((s, r) => s + r.valor, 0), [rows]);
  const byMotivo     = useMemo(() => aggregateBy(rows, 'motivo'),  [rows]);
  const byProduto    = useMemo(() => aggregateBy(rows, 'produto'), [rows]);
  const byDia        = useMemo(() => groupByDate(rows), [rows]);
  const hasMotivo    = useMemo(() => rows.some(r => r.motivo),  [rows]);
  const hasProduto   = useMemo(() => rows.some(r => r.produto), [rows]);

  const periodoLabel = rows.length
    ? (() => {
        const sorted = [...rows].sort((a, b) => parseDate(a.data) - parseDate(b.data));
        return `${sorted[0].data.slice(0, 5)} – ${sorted[sorted.length - 1].data}`;
      })()
    : '—';

  const sorted = useMemo(() =>
    [...rows].sort((a, b) => (parseDate(b.data) || 0) - (parseDate(a.data) || 0)),
  [rows]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 80 }}>
        <RefreshCw size={28} color="#cc0000" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#555', fontSize: 14 }}>Carregando reembolsos...</p>
      </div>
    );
  }

  if (error && !allRows.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 80 }}>
        <AlertCircle size={28} color="#cc0000" />
        <p style={{ color: '#555', fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#444' }}>
          {rows.length} de {allRows.length} reembolsos · {updatedAt ? `atualizado ${new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
          {error && <span style={{ color: '#cc0000', marginLeft: 8 }}>{error}</span>}
        </div>
        <button onClick={refetch} disabled={refreshing} className="refresh-btn">
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {/* PRODUCT FILTER */}
      {produtos.length > 0 && (
        <ProductFilter produtos={produtos} produtoFiltro={produtoFiltro} onChange={setProdutoFiltro} />
      )}

      {/* DATE FILTER */}
      <PeriodFilter
        periodoLabel={periodoLabel}
        activePreset={activePreset}
        startDate={startDate}
        endDate={endDate}
        onApplyPreset={applyPreset}
        onDateChange={handleDateChange}
        onClear={clear}
      />

      {/* KPI CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card highlight">
          <div className="kpi-icon"><RotateCcw size={16} /></div>
          <div className="kpi-label">Total Reembolsos</div>
          <div className="kpi-value red">{rows.length}</div>
          <div className="kpi-sub">No período filtrado</div>
        </div>
        <div className="kpi-card kpi-negativo">
          <div className="kpi-icon"><DollarSign size={16} /></div>
          <div className="kpi-label">Valor Reembolsado</div>
          <div className="kpi-value negativo">{fmt(totalValor)}</div>
          <div className="kpi-sub">Total devolvido</div>
        </div>
        {hasMotivo && (
          <div className="kpi-card">
            <div className="kpi-icon"><Tag size={16} /></div>
            <div className="kpi-label">Motivos distintos</div>
            <div className="kpi-value">{byMotivo.length}</div>
            <div className="kpi-sub">Tipos de reembolso</div>
          </div>
        )}
        <div className="kpi-card">
          <div className="kpi-icon"><DollarSign size={16} /></div>
          <div className="kpi-label">Ticket Médio</div>
          <div className="kpi-value">{rows.length ? fmt(totalValor / rows.length) : '—'}</div>
          <div className="kpi-sub">Valor médio por reembolso</div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="charts-grid" style={{ marginBottom: 28 }}>

        {/* Reembolsos por dia */}
        <div className="chart-card full">
          <div className="chart-title"><span className="chart-title-dot" />Reembolsos por Dia</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={byDia} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="label" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip formatValue={formatTooltipValue} />} />
              <Line type="monotone" dataKey="count" name="Reembolsos" stroke="#cc0000" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Por motivo */}
        {hasMotivo && (
          <div className="chart-card">
            <div className="chart-title"><span className="chart-title-dot" />Por Motivo</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byMotivo} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} width={130} />
                <Tooltip content={<ChartTooltip formatValue={formatTooltipValue} />} />
                <Bar dataKey="count" name="Qtd" radius={[0, 3, 3, 0]}>
                  {byMotivo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Por produto */}
        {hasProduto && (
          <div className={`chart-card ${!hasMotivo ? 'full' : ''}`}>
            <div className="chart-title"><span className="chart-title-dot" />Por Produto</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byProduto} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} width={130} />
                <Tooltip content={<ChartTooltip formatValue={formatTooltipValue} />} />
                <Bar dataKey="count" name="Qtd" radius={[0, 3, 3, 0]}>
                  {byProduto.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Valor reembolsado por dia */}
        <div className="chart-card full">
          <div className="chart-title"><span className="chart-title-dot" />Valor Reembolsado por Dia</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byDia} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="label" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={formatTick} tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip formatValue={formatTooltipValue} />} />
              <Bar dataKey="valor" name="Valor" fill="#cc0000" radius={[3, 3, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABELA */}
      <div className="table-card">
        <div className="table-header">
          <div className="table-title"><span className="chart-title-dot" />Todos os Reembolsos</div>
          <div className="table-count">
            {rows.length} {rows.length !== allRows.length ? `de ${allRows.length} registros` : 'registros'}
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {headers.map((h, i) => <th key={i}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr key={i}>
                  {row._raw.map((cell, j) => (
                    <td key={j} style={{
                      color: j === 0 ? '#666' : '#ccc',
                      fontSize: j === 0 ? 12 : 13,
                    }}>
                      {headers[j]?.toLowerCase().includes('email') ? maskEmail(cell) : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
