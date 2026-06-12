import { useState, useMemo } from 'react';
import './App.css';
import { useSalesData } from './hooks/useSalesData';
import { useUtmData } from './hooks/useUtmData';
import UtmDashboard from './components/UtmDashboard';
import RefundsDashboard from './components/RefundsDashboard';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, DollarSign, Send, BarChart2,
  Calendar, RefreshCw, AlertCircle, Database, ShoppingCart, Percent, RotateCcw, Package,
} from 'lucide-react';

// ─── FORMATTERS ──────────────────────────────────────────────────────────────

const fmt = (v) =>
  v == null || isNaN(v) ? '—' :
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtROI = (v) =>
  v == null || isNaN(v) || !isFinite(v) ? '—' : v.toFixed(1) + 'x';

const fmtPct = (v) =>
  v == null || isNaN(v) ? '—' : v.toFixed(2) + '%';

const formatTick = (v) => {
  if (v == null) return '';
  if (v >= 1000) return 'R$' + (v / 1000).toFixed(1) + 'k';
  return 'R$' + v;
};

const roiClass = (roi) => {
  if (roi == null || isNaN(roi)) return 'roi-baixo';
  if (roi >= 20) return 'roi-alto';
  if (roi >= 8) return 'roi-medio';
  return 'roi-baixo';
};

// ─── DATE UTILS ──────────────────────────────────────────────────────────────

// "dd/MM/yyyy" → Date
const parseDate = (str) => {
  if (!str) return null;
  const [d, m, y] = str.split('/');
  return new Date(+y, +m - 1, +d);
};

// Date → "yyyy-MM-dd" (valor do input[type=date])
// Usa componentes locais para evitar bug de fuso horário com toISOString()
const toInputVal = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// "yyyy-MM-dd" → Date
const fromInputVal = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-');
  return new Date(+y, +m - 1, +d);
};

const PRESETS = [
  { label: '7d',   days: 7 },
  { label: '14d',  days: 14 },
  { label: '30d',  days: 30 },
  { label: 'Tudo', days: null },
];

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#666', marginBottom: 6, fontSize: 11 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>
            {p.name.includes('ROI') ? fmtROI(p.value)
              : p.name.includes('%') ? fmtPct(p.value)
              : (p.name === 'Envios' || p.name === 'Vendas') ? p.value
              : fmt(p.value)}
          </strong>
        </p>
      ))}
    </div>
  );
};

// ─── APP ─────────────────────────────────────────────────────────────────────

function App() {
  const { data: allData, loading, refreshing, error, updatedAt, source, refetch } = useSalesData();
  const { data: utmAllData } = useUtmData();

  const [activeTab, setActiveTab]       = useState('principal');
  const [activePreset, setActivePreset] = useState('Tudo');
  const [startDate, setStartDate]       = useState('');
  const [endDate, setEndDate]           = useState('');
  const [produtoFiltro, setProdutoFiltro] = useState('Todos');

  // Lista de produtos da aba Vendas
  const produtos = useMemo(() => {
    const set = new Set(utmAllData.map(r => r.produto).filter(Boolean));
    return ['Todos', ...Array.from(set).sort()];
  }, [utmAllData]);

  // Aplica filtro de datas
  const salesData = useMemo(() => {
    if (!allData.length) return [];

    let from = startDate ? fromInputVal(startDate) : null;
    let to   = endDate   ? fromInputVal(endDate)   : null;

    return allData.filter(row => {
      const d = parseDate(row.dia);
      if (!d) return false;
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      return true;
    });
  }, [allData, startDate, endDate]);

  function applyPreset(preset) {
    setActivePreset(preset.label);
    if (!preset.days) {
      setStartDate('');
      setEndDate('');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = new Date(today);
    from.setDate(from.getDate() - preset.days + 1);
    setStartDate(toInputVal(from));
    setEndDate(toInputVal(today));
  }

  function handleDateChange(type, val) {
    setActivePreset('');
    if (type === 'start') setStartDate(val);
    else setEndDate(val);
  }

  // ── Loading / empty states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <RefreshCw size={28} color="#cc0000" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#555', fontSize: 14 }}>Carregando dados do Google Sheets...</p>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  if (!allData.length) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <AlertCircle size={28} color="#cc0000" />
        <p style={{ color: '#555', fontSize: 14 }}>Nenhum dado encontrado.</p>
      </div>
    );
  }

  // ── KPIs baseados no período filtrado ──────────────────────────────────────

  const last               = salesData.length ? salesData[salesData.length - 1] : allData[allData.length - 1];
  const totalEnvios        = salesData.reduce((s, d) => s + d.quantEnvios, 0);
  const fatPeriodoSum      = salesData.reduce((s, d) => s + d.faturamentoPeriodo, 0);
  const gastoPeriodoSum    = salesData.reduce((s, d) => s + d.gastoperiodo, 0);
  const roiCalculado       = gastoPeriodoSum > 0 ? fatPeriodoSum / gastoPeriodoSum : 0;
  const totalVendasPeriodo  = salesData.reduce((s, d) => s + d.quantVendasPeriodo, 0);

  // UTM filtrado por produto + período (para KPIs de produto)
  const utmFiltrado = useMemo(() => {
    const from = startDate ? fromInputVal(startDate) : null;
    const to   = endDate   ? fromInputVal(endDate)   : null;
    return utmAllData.filter(r => {
      if (produtoFiltro !== 'Todos' && r.produto !== produtoFiltro) return false;
      const d = parseDate(r.data);
      if (!d) return false;
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      return true;
    });
  }, [utmAllData, produtoFiltro, startDate, endDate]);

  const filtrando          = produtoFiltro !== 'Todos';
  const vendasExibido      = filtrando ? utmFiltrado.length : totalVendasPeriodo;
  const faturamentoExibido = filtrando ? utmFiltrado.reduce((s, r) => s + r.valor, 0) : fatPeriodoSum;
  const roiExibido         = filtrando ? (gastoPeriodoSum > 0 ? faturamentoExibido / gastoPeriodoSum : 0) : roiCalculado;
  const conversaoPeriodo   = totalEnvios > 0 ? (vendasExibido / totalEnvios) * 100 : 0;

  const chartData = salesData.map(d => ({ ...d, label: d.dia.slice(0, 5) }));

  const periodoLabel = salesData.length
    ? `${salesData[0].dia.slice(0, 5)} – ${last.dia}`
    : '—';

  return (
    <div className="dashboard">
      {/* HEADER */}
      <div className="header">
        <div className="header-left">
          <div className="header-logo">GM</div>
          <div>
            <div className="header-title">Dashboard Recuperação de Vendas</div>
            <div className="header-subtitle">Acompanhamento diário de performance</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#444' }}>
            <Database size={11} color={source === 'sheets' ? '#4ade80' : '#555'} />
            {source === 'sheets'
              ? <>Google Sheets · {updatedAt ? new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</>
              : 'Dados locais'}
            {error && <span style={{ color: '#cc0000', marginLeft: 4 }}>· {error}</span>}
          </div>

          {/* Botão de refresh */}
          <button
            onClick={refetch}
            disabled={refreshing}
            className="refresh-btn"
            title="Atualizar dados"
          >
            <RefreshCw
              size={14}
              style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}
            />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="tab-bar">
        <button className={`tab-btn ${activeTab === 'principal' ? 'active' : ''}`} onClick={() => setActiveTab('principal')}>
          Dashboard Principal
        </button>
        <button className={`tab-btn ${activeTab === 'utm' ? 'active' : ''}`} onClick={() => setActiveTab('utm')}>
          Vendas por UTM
        </button>
        <button className={`tab-btn ${activeTab === 'reembolsos' ? 'active' : ''}`} onClick={() => setActiveTab('reembolsos')}>
          Reembolsos
        </button>
      </div>

      {activeTab === 'utm' && <UtmDashboard />}
      {activeTab === 'reembolsos' && <RefundsDashboard />}

      {activeTab === 'principal' && <>

      {/* PRODUCT FILTER */}
      <div className="date-filter" style={{ marginBottom: 10 }}>
        <div className="date-filter-left">
          <Package size={14} color="#cc0000" />
          <span className="date-filter-label">Produto:</span>
        </div>
        <div className="date-filter-right">
          <div className="preset-group">
            {produtos.map(p => (
              <button
                key={p}
                className={`preset-btn ${produtoFiltro === p ? 'active' : ''}`}
                onClick={() => setProdutoFiltro(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DATE FILTER */}
      <div className="date-filter">
        <div className="date-filter-left">
          <Calendar size={14} color="#cc0000" />
          <span className="date-filter-label">Período:</span>
          <span className="date-filter-period">{periodoLabel}</span>
        </div>

        <div className="date-filter-right">
          {/* Presets */}
          <div className="preset-group">
            {PRESETS.map(p => (
              <button
                key={p.label}
                className={`preset-btn ${activePreset === p.label ? 'active' : ''}`}
                onClick={() => applyPreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date inputs */}
          <div className="date-inputs">
            <div className="date-input-wrap">
              <input
                type="date"
                className="date-input"
                value={startDate}
                max={endDate || toInputVal(new Date())}
                onChange={e => handleDateChange('start', e.target.value)}
              />
            </div>
            <span style={{ color: '#333', fontSize: 12 }}>→</span>
            <div className="date-input-wrap">
              <input
                type="date"
                className="date-input"
                value={endDate}
                min={startDate || ''}
                onChange={e => handleDateChange('end', e.target.value)}
              />
            </div>
          </div>

          {(startDate || endDate) && (
            <button className="clear-btn" onClick={() => applyPreset({ label: 'Tudo', days: null })}>
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card highlight">
          <div className="kpi-icon"><TrendingUp size={16} /></div>
          <div className="kpi-label">ROI do Período</div>
          <div className="kpi-value red">{fmtROI(roiExibido)}</div>
          <div className="kpi-sub">{filtrando ? 'Fat. produto ÷ Gasto total' : 'Fat. ÷ Gasto'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><DollarSign size={16} /></div>
          <div className="kpi-label">Faturamento Período</div>
          <div className="kpi-value">{fmt(faturamentoExibido)}</div>
          <div className="kpi-sub">{filtrando ? produtoFiltro : 'Receita no período'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><BarChart2 size={16} /></div>
          <div className="kpi-label">Gasto Período</div>
          <div className="kpi-value">{fmt(gastoPeriodoSum)}</div>
          <div className="kpi-sub">Investimento total</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><Send size={16} /></div>
          <div className="kpi-label">Envios Período</div>
          <div className="kpi-value">{totalEnvios.toLocaleString('pt-BR')}</div>
          <div className="kpi-sub">Mensagens disparadas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><ShoppingCart size={16} /></div>
          <div className="kpi-label">Vendas Período</div>
          <div className="kpi-value">{vendasExibido.toLocaleString('pt-BR')}</div>
          <div className="kpi-sub">{filtrando ? produtoFiltro : 'Conversões no período'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><Percent size={16} /></div>
          <div className="kpi-label">Conversão Período</div>
          <div className="kpi-value">{fmtPct(conversaoPeriodo)}</div>
          <div className="kpi-sub">Taxa de conversão</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon"><RotateCcw size={16} /></div>
          <div className="kpi-label">Reembolsos</div>
          <div className="kpi-value">{salesData.reduce((s, d) => s + (d.quantReembolsos || 0), 0).toLocaleString('pt-BR')}</div>
          <div className="kpi-sub">No período filtrado</div>
        </div>
        <div className={`kpi-card ${salesData.reduce((s, d) => s + (d.lucroPeriodo || 0), 0) >= 0 ? '' : 'kpi-negativo'}`}>
          <div className="kpi-icon"><DollarSign size={16} /></div>
          <div className="kpi-label">Lucro do Período</div>
          <div className={`kpi-value ${salesData.reduce((s, d) => s + (d.lucroPeriodo || 0), 0) >= 0 ? 'positivo' : 'negativo'}`}>
            {fmt(salesData.reduce((s, d) => s + (d.lucroPeriodo || 0), 0))}
          </div>
          <div className="kpi-sub">Lucro líquido no filtro</div>
        </div>
      </div>


      {/* CHARTS */}
      <div className="charts-grid">
        <div className="chart-card full">
          <div className="chart-title"><span className="chart-title-dot" />Faturamento vs Gasto vs Lucro — Acumulado</div>
          <div className="chart-legend">
            <div className="legend-item"><div className="legend-dot" style={{ background: '#cc0000' }} />Faturamento Total</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: '#555' }} />Gasto Total</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: '#4ade80' }} />Lucro Total</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#cc0000" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#cc0000" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gastoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#555" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#555" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lucroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="label" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={formatTick} tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="faturamentoTotal" name="Faturamento Total" stroke="#cc0000" fill="url(#fatGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="gastoTotal" name="Gasto Total" stroke="#555" fill="url(#gastoGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="lucroTotal" name="Lucro Total" stroke="#4ade80" fill="url(#lucroGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title"><span className="chart-title-dot" />ROI Total por Dia</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="label" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="roiTotal" name="ROI Total" stroke="#cc0000" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title"><span className="chart-title-dot" />Envios por Dia</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="label" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="quantEnvios" name="Envios" fill="#cc0000" radius={[3, 3, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title"><span className="chart-title-dot" />Vendas por Dia</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="label" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="quantVendasPeriodo" name="Vendas" fill="#cc0000" radius={[3, 3, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card full">
          <div className="chart-title"><span className="chart-title-dot" />Conversão do Período (%)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="label" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v + '%'} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="conversaoPeriodo" name="Conversão Período %" stroke="#cc0000" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="conversaoTotal" name="Conversão Total %" stroke="#444" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card full">
          <div className="chart-title"><span className="chart-title-dot" />Faturamento do Período vs Gasto do Período</div>
          <div className="chart-legend">
            <div className="legend-item"><div className="legend-dot" style={{ background: '#cc0000' }} />Faturamento Período</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: '#333' }} />Gasto Período</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="label" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={formatTick} tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="faturamentoPeriodo" name="Faturamento Período" fill="#cc0000" radius={[3, 3, 0, 0]} opacity={0.85} />
              <Bar dataKey="gastoperiodo" name="Gasto Período" fill="#333" radius={[3, 3, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABELA */}
      <div className="table-card">
        <div className="table-header">
          <div className="table-title"><span className="chart-title-dot" />Histórico Detalhado</div>
          <div className="table-count">
            {salesData.length} {salesData.length !== allData.length ? `de ${allData.length} registros` : 'registros'}
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Dia</th>
                <th>Gasto Total</th>
                <th>Fat. Total</th>
                <th>ROI Total</th>
                <th>Gasto Per.</th>
                <th>Fat. Período</th>
                <th>ROI Per.</th>
                <th>Envios Per.</th>
                <th>Envios Total</th>
                <th>Vendas Per.</th>
                <th>Conv. Per.</th>
                <th>Vendas Total</th>
                <th>Conv. Total</th>
                <th>Reembolsos</th>
                <th>Lucro Per.</th>
                <th>Lucro Total</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((row, i) => (
                <tr key={i}>
                  <td className="dia">{row.dia}</td>
                  <td>{fmt(row.gastoTotal)}</td>
                  <td className={row.faturamentoTotal > 0 ? 'valor-positivo' : 'badge-zero'}>{fmt(row.faturamentoTotal)}</td>
                  <td className={roiClass(row.roiTotal)}>{fmtROI(row.roiTotal)}</td>
                  <td>{fmt(row.gastoperiodo)}</td>
                  <td className={row.faturamentoPeriodo > 0 ? 'valor-positivo' : 'badge-zero'}>{fmt(row.faturamentoPeriodo)}</td>
                  <td className={roiClass(row.roiPeriodo)}>{fmtROI(row.roiPeriodo)}</td>
                  <td className={row.quantEnvios >= 100 ? 'envios-alto' : ''}>
                    {row.quantEnvios === 0 ? <span className="badge-zero">0</span> : row.quantEnvios}
                  </td>
                  <td>{row.quantEnviosTotal || <span className="badge-zero">0</span>}</td>
                  <td className={row.quantVendasPeriodo > 0 ? 'valor-positivo' : 'badge-zero'}>
                    {row.quantVendasPeriodo || 0}
                  </td>
                  <td>{fmtPct(row.conversaoPeriodo)}</td>
                  <td>{row.quantVendasTotal || <span className="badge-zero">0</span>}</td>
                  <td>{fmtPct(row.conversaoTotal)}</td>
                  <td className={row.quantReembolsos > 0 ? 'roi-alto' : 'badge-zero'}>
                    {row.quantReembolsos || 0}
                  </td>
                  <td className={row.lucroPeriodo > 0 ? 'valor-positivo' : row.lucroPeriodo < 0 ? 'roi-alto' : 'badge-zero'}>
                    {fmt(row.lucroPeriodo || 0)}
                  </td>
                  <td className={row.lucroTotal > 0 ? 'valor-positivo' : row.lucroTotal < 0 ? 'roi-alto' : 'badge-zero'}>
                    {fmt(row.lucroTotal || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="footer">
        GM Pro · Dashboard Recuperação de Vendas · {new Date().toLocaleDateString('pt-BR')}
      </div>
      </>}
    </div>
  );
}

export default App;
