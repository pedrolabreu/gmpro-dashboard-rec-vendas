import { useState, useMemo } from 'react';
import './App.css';
import { useSalesData } from './hooks/useSalesData';
import { useUtmData } from './hooks/useUtmData';
import { useEnviosData } from './hooks/useEnviosData';
import { useRefundData } from './hooks/useRefundData';
import { useDateRangeFilter } from './hooks/useDateRangeFilter';
import { resolveTipoEnvio } from './config';
import { parseDate, fromInputVal } from './utils/date';
import { fmt, fmtROI, fmtPct, formatTick } from './utils/format';
import UtmDashboard from './components/UtmDashboard';
import RefundsDashboard from './components/RefundsDashboard';
import GeralDashboard from './components/GeralDashboard';
import MetaProgress from './components/MetaProgress';
import StructureMenu from './components/StructureMenu';
import ChartTooltip from './components/ChartTooltip';
import { ProductFilter, PeriodFilter } from './components/FilterBar';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, DollarSign, Send, BarChart2,
  RefreshCw, AlertCircle, Database, ShoppingCart, Percent, RotateCcw,
} from 'lucide-react';

const roiClass = (roi) => {
  if (roi == null || isNaN(roi)) return 'roi-baixo';
  if (roi >= 20) return 'roi-alto';
  if (roi >= 8) return 'roi-medio';
  return 'roi-baixo';
};

const formatTooltipValue = (name, value) =>
  name.includes('ROI') ? fmtROI(value)
    : name.includes('%') ? fmtPct(value)
    : (name === 'Envios' || name === 'Vendas') ? value
    : fmt(value);

// ─── APP ─────────────────────────────────────────────────────────────────────

function App() {
  const { data: allData, loading, refreshing, error, updatedAt, source, refetch } = useSalesData();
  const { data: utmAllData } = useUtmData();
  const { countEnvios, calcGasto, tiposUnicos } = useEnviosData();
  const { rows: allReembolsos } = useRefundData();

  const [estrutura, setEstrutura]         = useState('recuperacao');
  const [activeTab, setActiveTab]         = useState('principal');
  const [produtoFiltro, setProdutoFiltro] = useState('Todos');
  const { activePreset, startDate, endDate, applyPreset, handleDateChange, clear } = useDateRangeFilter();

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

  // UTM filtrado por produto + período (deve ficar antes dos early returns)
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

  // Reembolsos filtrados por produto + período (antes dos early returns)
  const reembolsosExibido = useMemo(() => {
    const from = startDate ? fromInputVal(startDate) : null;
    const to   = endDate   ? fromInputVal(endDate)   : null;
    const filtra = produtoFiltro !== 'Todos';
    return allReembolsos.filter(r => {
      if (filtra && r.produto !== produtoFiltro) return false;
      const d = parseDate(r.data);
      if (!d) return false;
      if (from && d < from) return false;
      if (to   && d > to)   return false;
      return true;
    }).length;
  }, [allReembolsos, produtoFiltro, startDate, endDate]);

  // ── Conteúdo da estrutura "Recuperação" ─────────────────────────────────────

  let recuperacaoContent;

  if (loading) {
    recuperacaoContent = (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 80 }}>
        <RefreshCw size={28} color="#cc0000" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#555', fontSize: 14 }}>Carregando dados do Google Sheets...</p>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  } else if (!allData.length) {
    recuperacaoContent = (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 80 }}>
        <AlertCircle size={28} color="#cc0000" />
        <p style={{ color: '#555', fontSize: 14 }}>Nenhum dado encontrado.</p>
      </div>
    );
  } else {

  // ── KPIs baseados no período filtrado ──────────────────────────────────────

  const last               = salesData.length ? salesData[salesData.length - 1] : allData[allData.length - 1];
  const fatPeriodoSum      = salesData.reduce((s, d) => s + d.faturamentoPeriodo, 0);
  const totalVendasPeriodo = salesData.reduce((s, d) => s + d.quantVendasPeriodo, 0);

  const filtrando = produtoFiltro !== 'Todos';

  // Envios filtrados por produto (via aba Envios - Recuperação)
  const tipoEnvio   = filtrando ? resolveTipoEnvio(produtoFiltro) : null;
  const from        = startDate ? fromInputVal(startDate) : null;
  const to          = endDate   ? fromInputVal(endDate)   : null;
  const totalEnvios = filtrando
    ? countEnvios(tipoEnvio, from, to)
    : salesData.reduce((s, d) => s + d.quantEnvios, 0);

  // Gasto calculado dinamicamente: R$1,11/recuperacao ou R$0,37/segunda_tentativa
  const gastoPeriodoSum    = filtrando
    ? calcGasto(tipoEnvio, from, to)
    : calcGasto(null, from, to);
  const vendasExibido      = filtrando ? utmFiltrado.length : totalVendasPeriodo;
  const faturamentoExibido = filtrando ? utmFiltrado.reduce((s, r) => s + r.valor, 0) : fatPeriodoSum;
  const roiExibido         = gastoPeriodoSum > 0 ? faturamentoExibido / gastoPeriodoSum : 0;
  const conversaoPeriodo   = totalEnvios > 0 ? (vendasExibido / totalEnvios) * 100 : 0;

  // Lucro = Faturamento - Gasto - 10% imposto sobre faturamento
  const lucroExibido = faturamentoExibido * 0.90 - gastoPeriodoSum;

  const chartData = salesData.map(d => ({ ...d, label: d.dia.slice(0, 5) }));

  const periodoLabel = salesData.length
    ? `${salesData[0].dia.slice(0, 5)} – ${last.dia}`
    : '—';

  recuperacaoContent = (
    <>
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
          <div className="kpi-value">{reembolsosExibido.toLocaleString('pt-BR')}</div>
          <div className="kpi-sub">{filtrando ? produtoFiltro : 'No período filtrado'}</div>
        </div>
        <div className={`kpi-card ${lucroExibido >= 0 ? '' : 'kpi-negativo'}`}>
          <div className="kpi-icon"><DollarSign size={16} /></div>
          <div className="kpi-label">Lucro do Período</div>
          <div className={`kpi-value ${lucroExibido >= 0 ? 'positivo' : 'negativo'}`}>
            {fmt(lucroExibido)}
          </div>
          <div className="kpi-sub">Faturamento − Gasto</div>
        </div>
      </div>

      {/* METAS DO MÊS */}
      <MetaProgress data={allData} />

      {/* CHARTS */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title"><span className="chart-title-dot" />Faturamento vs Gasto vs Lucro — Acumulado</div>
          <div className="chart-legend">
            <div className="legend-item"><div className="legend-dot" style={{ background: '#cc0000' }} />Faturamento Total</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: '#555' }} />Gasto Total</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: '#4ade80' }} />Lucro Total</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
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
              <Tooltip content={<ChartTooltip formatValue={formatTooltipValue} />} />
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
              <Tooltip content={<ChartTooltip formatValue={formatTooltipValue} />} />
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
              <Tooltip content={<ChartTooltip formatValue={formatTooltipValue} />} />
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
              <Tooltip content={<ChartTooltip formatValue={formatTooltipValue} />} />
              <Bar dataKey="quantVendasPeriodo" name="Vendas" fill="#cc0000" radius={[3, 3, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title"><span className="chart-title-dot" />Conversão do Período (%)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="label" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v + '%'} />
              <Tooltip content={<ChartTooltip formatValue={formatTooltipValue} />} />
              <Line type="monotone" dataKey="conversaoPeriodo" name="Conversão Período %" stroke="#cc0000" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="conversaoTotal" name="Conversão Total %" stroke="#444" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
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
              <Tooltip content={<ChartTooltip formatValue={formatTooltipValue} />} />
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
    </>
  );

  }

  return (
    <div className="dashboard">
      {/* HEADER */}
      <div className="header">
        <div className="header-left">
          <div className="header-logo">GM</div>
          <div>
            <div className="header-title">
              Dashboard {estrutura === 'geral' ? 'Geral' : 'Recuperação de Vendas'}
            </div>
            <div className="header-subtitle">
              {estrutura === 'geral' ? 'Visão geral do negócio' : 'Acompanhamento diário de performance'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {estrutura === 'recuperacao' && (
            <>
              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#444' }}>
                <Database size={11} color={source === 'sheets' ? '#4ade80' : '#555'} />
                {source === 'sheets'
                  ? <>Google Sheets · {updatedAt ? new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</>
                  : 'Dados locais'}
                {error && <span style={{ color: '#cc0000', marginLeft: 4 }}>· {error}</span>}
                {tiposUnicos.length > 0 && <span style={{ color: '#333', marginLeft: 4 }}>· envios: [{tiposUnicos.join(', ')}]</span>}
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
            </>
          )}

          {/* Seletor de estrutura */}
          <StructureMenu value={estrutura} onChange={setEstrutura} />
        </div>
      </div>

      {estrutura === 'geral' ? <GeralDashboard /> : recuperacaoContent}
    </div>
  );
}

export default App;
