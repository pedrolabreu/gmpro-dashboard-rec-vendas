import { useState, useMemo } from 'react';
import { useUtmData } from '../hooks/useUtmData';
import { useDateRangeFilter } from '../hooks/useDateRangeFilter';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { RefreshCw, AlertCircle, DollarSign, ShoppingCart, Tag, Wifi } from 'lucide-react';
import { parseDate, fromInputVal } from '../utils/date';
import { fmt, formatTick, maskEmail } from '../utils/format';
import ChartTooltip from './ChartTooltip';
import { ProductFilter, PeriodFilter } from './FilterBar';

const formatTooltipValue = (name, value) => (name === 'Valor' ? fmt(value) : value);

function aggregate(data, key) {
  const map = {};
  data.forEach(row => {
    const k = row[key] || '(vazio)';
    if (!map[k]) map[k] = { name: k, count: 0, valor: 0 };
    map[k].count += 1;
    map[k].valor += row.valor;
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
}

const COLORS = ['#cc0000', '#ff3333', '#ff6666', '#ff9999', '#ffcccc'];

export default function UtmDashboard() {
  const { data: allData, loading, refreshing, error, updatedAt, refetch } = useUtmData();

  const [produtoFiltro, setProdutoFiltro] = useState('Todos');
  const { activePreset, startDate, endDate, applyPreset, handleDateChange, clear } = useDateRangeFilter();

  // Lista de produtos únicos
  const produtos = useMemo(() => {
    const set = new Set(allData.map(r => r.produto).filter(Boolean));
    return ['Todos', ...Array.from(set).sort()];
  }, [allData]);

  // Filtered data (data + produto)
  const data = useMemo(() => {
    if (!allData.length) return [];
    const from = startDate ? fromInputVal(startDate) : null;
    const to   = endDate   ? fromInputVal(endDate)   : null;
    return allData.filter(row => {
      const d = parseDate(row.data);
      if (!d) return false;
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      if (produtoFiltro !== 'Todos' && row.produto !== produtoFiltro) return false;
      return true;
    });
  }, [allData, startDate, endDate, produtoFiltro]);

  const byTerm   = useMemo(() => aggregate(data, 'utmTerm'),   [data]);
  const byMedium = useMemo(() => aggregate(data, 'utmMedium'), [data]);

  const totalValor    = useMemo(() => data.reduce((s, r) => s + r.valor, 0), [data]);
  const uniqueTerms   = useMemo(() => new Set(data.map(r => r.utmTerm)).size,   [data]);
  const uniqueMediums = useMemo(() => new Set(data.map(r => r.utmMedium)).size, [data]);

  const sorted = useMemo(() =>
    [...data].sort((a, b) => parseDate(b.data) - parseDate(a.data)),
  [data]);

  const periodoLabel = data.length
    ? (() => {
        const dates = [...data].sort((a, b) => parseDate(a.data) - parseDate(b.data));
        return `${dates[0].data.slice(0, 5)} – ${dates[dates.length - 1].data}`;
      })()
    : '—';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 80 }}>
        <RefreshCw size={28} color="#cc0000" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#555', fontSize: 14 }}>Carregando vendas...</p>
      </div>
    );
  }

  if (error && !allData.length) {
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
          {data.length} de {allData.length} vendas · {updatedAt ? `atualizado ${new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
          {error && <span style={{ color: '#cc0000', marginLeft: 8 }}>{error}</span>}
        </div>
        <button onClick={refetch} disabled={refreshing} className="refresh-btn">
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {/* PRODUCT FILTER */}
      <ProductFilter produtos={produtos} produtoFiltro={produtoFiltro} onChange={setProdutoFiltro} />

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
          <div className="kpi-icon"><ShoppingCart size={16} /></div>
          <div className="kpi-label">Total de Vendas</div>
          <div className="kpi-value red">{data.length}</div>
          <div className="kpi-sub">Conversões registradas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><DollarSign size={16} /></div>
          <div className="kpi-label">Valor Total</div>
          <div className="kpi-value">{fmt(totalValor)}</div>
          <div className="kpi-sub">Receita gerada</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><Tag size={16} /></div>
          <div className="kpi-label">UTM Terms</div>
          <div className="kpi-value">{uniqueTerms}</div>
          <div className="kpi-sub">Origens distintas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><Wifi size={16} /></div>
          <div className="kpi-label">UTM Mediums</div>
          <div className="kpi-value">{uniqueMediums}</div>
          <div className="kpi-sub">Canais distintos</div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="charts-grid" style={{ marginBottom: 28 }}>

        {/* Vendas por utm_term */}
        <div className="chart-card">
          <div className="chart-title"><span className="chart-title-dot" />Vendas por UTM Term</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byTerm} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} width={120} />
              <Tooltip content={<ChartTooltip formatValue={formatTooltipValue} />} />
              <Bar dataKey="count" name="Vendas" radius={[0, 3, 3, 0]}>
                {byTerm.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Valor por utm_term */}
        <div className="chart-card">
          <div className="chart-title"><span className="chart-title-dot" />Valor por UTM Term</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byTerm} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
              <XAxis type="number" tickFormatter={formatTick} tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} width={120} />
              <Tooltip content={<ChartTooltip formatValue={formatTooltipValue} />} />
              <Bar dataKey="valor" name="Valor" radius={[0, 3, 3, 0]}>
                {byTerm.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vendas por utm_medium */}
        <div className="chart-card full">
          <div className="chart-title"><span className="chart-title-dot" />Vendas por UTM Medium</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byMedium} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip formatValue={formatTooltipValue} />} />
              <Bar dataKey="count" name="Vendas" radius={[3, 3, 0, 0]}>
                {byMedium.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABELA */}
      <div className="table-card">
        <div className="table-header">
          <div className="table-title"><span className="chart-title-dot" />Todas as Vendas</div>
          <div className="table-count">
            {data.length} {data.length !== allData.length ? `de ${allData.length} registros` : 'registros'}
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Email</th>
                <th>Valor</th>
                <th>Produto</th>
                <th>UTM Term</th>
                <th>UTM Medium</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr key={i}>
                  <td className="dia">{row.data}</td>
                  <td style={{ color: '#666', fontSize: 12 }}>{maskEmail(row.email)}</td>
                  <td className="valor-positivo">{fmt(row.valor)}</td>
                  <td style={{ color: '#ccc', fontSize: 12 }}>{row.produto || '—'}</td>
                  <td><span style={{ background: '#1a0000', color: '#cc0000', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{row.utmTerm}</span></td>
                  <td style={{ color: '#888' }}>{row.utmMedium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
