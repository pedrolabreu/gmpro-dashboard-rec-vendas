import { useState, useMemo } from 'react';
import { useGeralSalesData, useGeralRefundData } from '../hooks/useGeralData';
import { useDateRangeFilter } from '../hooks/useDateRangeFilter';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { RefreshCw, AlertCircle, DollarSign, ShoppingCart, CreditCard } from 'lucide-react';
import { parseDate, fromInputVal } from '../utils/date';
import { fmt, maskEmail } from '../utils/format';
import ChartTooltip from './ChartTooltip';
import { ProductFilter, PeriodFilter } from './FilterBar';

const formatTooltipValue = (name, value) => (name === 'Valor' ? fmt(value) : value);

const COLORS = ['#cc0000', '#ff3333', '#ff6666', '#ff9999', '#ffcccc'];

function aggregate(rows, key) {
  const map = {};
  rows.forEach(r => {
    const k = r[key] || '(vazio)';
    if (!map[k]) map[k] = { name: k, count: 0, valor: 0 };
    map[k].count += 1;
    map[k].valor += r.valor;
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
}

function GeralPanel({ source, emptyLabel }) {
  const { data: allRows, loading, refreshing, error, updatedAt, refetch } = source;

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

  const totalValor = useMemo(() => rows.reduce((s, r) => s + r.valor, 0), [rows]);
  const byProduto  = useMemo(() => aggregate(rows, 'produto'), [rows]);
  const byGateway  = useMemo(() => aggregate(rows, 'gateway'), [rows]);
  const byOferta   = useMemo(() => aggregate(rows, 'oferta'),  [rows]);
  const hasOferta  = useMemo(() => rows.some(r => r.oferta),  [rows]);

  const sorted = useMemo(() =>
    [...rows].sort((a, b) => (parseDate(b.data) || 0) - (parseDate(a.data) || 0)),
  [rows]);

  const periodoLabel = rows.length
    ? (() => {
        const s = [...rows].sort((a, b) => parseDate(a.data) - parseDate(b.data));
        return `${s[0].data.slice(0, 5)} – ${s[s.length - 1].data}`;
      })()
    : '—';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 80 }}>
        <RefreshCw size={28} color="#cc0000" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#555', fontSize: 14 }}>Carregando dados...</p>
      </div>
    );
  }

  if (!allRows.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 80 }}>
        <AlertCircle size={28} color="#cc0000" />
        <p style={{ color: '#555', fontSize: 14 }}>{error || emptyLabel}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#444' }}>
          {rows.length} de {allRows.length} registros · {updatedAt ? `atualizado ${new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
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
          <div className="kpi-icon"><ShoppingCart size={16} /></div>
          <div className="kpi-label">Total de Registros</div>
          <div className="kpi-value red">{rows.length}</div>
          <div className="kpi-sub">No período filtrado</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><DollarSign size={16} /></div>
          <div className="kpi-label">Valor Total</div>
          <div className="kpi-value">{fmt(totalValor)}</div>
          <div className="kpi-sub">Soma do período</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><DollarSign size={16} /></div>
          <div className="kpi-label">Ticket Médio</div>
          <div className="kpi-value">{rows.length ? fmt(totalValor / rows.length) : '—'}</div>
          <div className="kpi-sub">Valor médio por registro</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><CreditCard size={16} /></div>
          <div className="kpi-label">Gateways</div>
          <div className="kpi-value">{byGateway.length}</div>
          <div className="kpi-sub">Meios de pagamento distintos</div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="charts-grid" style={{ marginBottom: 28 }}>
        <div className="chart-card">
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

        <div className="chart-card">
          <div className="chart-title"><span className="chart-title-dot" />Por Gateway</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byGateway} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} width={130} />
              <Tooltip content={<ChartTooltip formatValue={formatTooltipValue} />} />
              <Bar dataKey="count" name="Qtd" radius={[0, 3, 3, 0]}>
                {byGateway.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {hasOferta && (
          <div className="chart-card full">
            <div className="chart-title"><span className="chart-title-dot" />Por Oferta</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byOferta} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip formatValue={formatTooltipValue} />} />
                <Bar dataKey="count" name="Qtd" fill="#cc0000" radius={[3, 3, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* TABELA */}
      <div className="table-card">
        <div className="table-header">
          <div className="table-title"><span className="chart-title-dot" />Todos os Registros</div>
          <div className="table-count">
            {rows.length} {rows.length !== allRows.length ? `de ${allRows.length} registros` : 'registros'}
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Gateway</th>
                <th>Produto</th>
                <th>Oferta</th>
                <th>Status</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr key={i}>
                  <td className="dia">{row.data}</td>
                  <td style={{ color: '#ccc', fontSize: 12 }}>{row.nome}</td>
                  <td style={{ color: '#666', fontSize: 12 }}>{maskEmail(row.email)}</td>
                  <td style={{ color: '#888' }}>{row.gateway}</td>
                  <td style={{ color: '#ccc', fontSize: 12 }}>{row.produto}</td>
                  <td style={{ color: '#888' }}>{row.oferta || '—'}</td>
                  <td style={{ color: '#888' }}>{row.status}</td>
                  <td className="valor-positivo">{fmt(row.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function GeralDashboard() {
  const [tab, setTab] = useState('vendas');
  const salesSource  = useGeralSalesData();
  const refundSource = useGeralRefundData();

  return (
    <div>
      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'vendas' ? 'active' : ''}`} onClick={() => setTab('vendas')}>
          Geral
        </button>
        <button className={`tab-btn ${tab === 'reembolsos' ? 'active' : ''}`} onClick={() => setTab('reembolsos')}>
          Reembolsos
        </button>
      </div>

      {tab === 'vendas'
        ? <GeralPanel source={salesSource} emptyLabel="Nenhuma venda encontrada na planilha Geral." />
        : <GeralPanel source={refundSource} emptyLabel="Nenhum reembolso encontrado na planilha Geral." />}
    </div>
  );
}
