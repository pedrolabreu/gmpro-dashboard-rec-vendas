import './App.css';
import { useSalesData } from './hooks/useSalesData';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign, Send, BarChart2, Activity, Calendar, RefreshCw, AlertCircle, Database } from 'lucide-react';

const fmt = (v) =>
  v == null || isNaN(v) ? '—' :
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtROI = (v) =>
  v == null || isNaN(v) ? '—' : v.toFixed(1) + 'x';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#111',
      border: '1px solid #222',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <p style={{ color: '#666', marginBottom: 6, fontSize: 11 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.name.includes('ROI') ? fmtROI(p.value) : p.name === 'Envios' ? p.value : fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

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

function App() {
  const { data: salesData, loading, error, updatedAt, source } = useSalesData();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <RefreshCw size={28} color="#cc0000" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#555', fontSize: 14 }}>Carregando dados do Google Sheets...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!salesData.length) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <AlertCircle size={28} color="#cc0000" />
        <p style={{ color: '#555', fontSize: 14 }}>Nenhum dado encontrado.</p>
      </div>
    );
  }

  const last = salesData[salesData.length - 1];
  const totalEnvios = salesData.reduce((s, d) => s + d.quantEnvios, 0);
  const diasComFaturamento = salesData.filter(d => d.faturamentoPeriodo > 0).length;

  const chartData = salesData.map(d => ({
    ...d,
    label: d.dia.slice(0, 5),
  }));

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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div className="header-badge">
            Período: <span>
              {salesData.length > 0
                ? `${salesData[0].dia.slice(0, 5)} – ${last.dia}`
                : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#444' }}>
            <Database size={11} color={source === 'sheets' ? '#4ade80' : '#555'} />
            {source === 'sheets'
              ? <>Google Sheets · atualizado {updatedAt ? new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</>
              : 'Dados locais (configure a URL do Apps Script)'}
            {error && <span style={{ color: '#cc0000', marginLeft: 4 }}>· {error}</span>}
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card highlight">
          <div className="kpi-icon"><TrendingUp size={16} /></div>
          <div className="kpi-label">ROI Total Atual</div>
          <div className="kpi-value red">{fmtROI(last.roiTotal)}</div>
          <div className="kpi-sub">Retorno acumulado</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><DollarSign size={16} /></div>
          <div className="kpi-label">Faturamento Total</div>
          <div className="kpi-value">{fmt(last.faturamentoTotal)}</div>
          <div className="kpi-sub">Receita acumulada</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><BarChart2 size={16} /></div>
          <div className="kpi-label">Gasto Total</div>
          <div className="kpi-value">{fmt(last.gastoTotal)}</div>
          <div className="kpi-sub">Investimento acumulado</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Send size={16} /></div>
          <div className="kpi-label">Total de Envios</div>
          <div className="kpi-value">{totalEnvios.toLocaleString('pt-BR')}</div>
          <div className="kpi-sub">Mensagens disparadas</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Activity size={16} /></div>
          <div className="kpi-label">Dias c/ Conversão</div>
          <div className="kpi-value">{diasComFaturamento}</div>
          <div className="kpi-sub">de {salesData.length} dias</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Calendar size={16} /></div>
          <div className="kpi-label">Último Faturamento</div>
          <div className="kpi-value" style={{ fontSize: 18 }}>{fmt(last.faturamentoPeriodo)}</div>
          <div className="kpi-sub">{last.dia}</div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="charts-grid">
        {/* Faturamento vs Gasto Acumulado */}
        <div className="chart-card full">
          <div className="chart-title">
            <span className="chart-title-dot" />
            Faturamento vs Gasto — Acumulado
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#cc0000' }} />
              Faturamento Total
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#444' }} />
              Gasto Total
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#cc0000" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#cc0000" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gastoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#444" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="label" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tickFormatter={formatTick} tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="faturamentoTotal" name="Faturamento Total" stroke="#cc0000" fill="url(#fatGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="gastoTotal" name="Gasto Total" stroke="#444" fill="url(#gastoGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ROI Total por dia */}
        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-title-dot" />
            ROI Total por Dia
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="label" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="roiTotal" name="ROI Total" stroke="#cc0000" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Envios por dia */}
        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-title-dot" />
            Envios por Dia
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="label" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="quantEnvios" name="Envios" fill="#cc0000" radius={[3, 3, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Faturamento vs Gasto do período */}
        <div className="chart-card full">
          <div className="chart-title">
            <span className="chart-title-dot" />
            Faturamento do Período vs Gasto do Período
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#cc0000' }} />
              Faturamento Período
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#333' }} />
              Gasto Período
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="label" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
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
          <div className="table-title">
            <span className="chart-title-dot" />
            Histórico Detalhado
          </div>
          <div className="table-count">{salesData.length} registros</div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Dia</th>
                <th>Gasto Total</th>
                <th>Faturamento Total</th>
                <th>ROI Total</th>
                <th>Gasto Período</th>
                <th>Faturamento Período</th>
                <th>ROI Período</th>
                <th>Qtd. Envios</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((row, i) => (
                <tr key={i}>
                  <td className="dia">{row.dia}</td>
                  <td>{fmt(row.gastoTotal)}</td>
                  <td className={row.faturamentoTotal > 0 ? 'valor-positivo' : 'badge-zero'}>
                    {fmt(row.faturamentoTotal)}
                  </td>
                  <td className={roiClass(row.roiTotal)}>{fmtROI(row.roiTotal)}</td>
                  <td>{fmt(row.gastoperiodo)}</td>
                  <td className={row.faturamentoPeriodo > 0 ? 'valor-positivo' : 'badge-zero'}>
                    {fmt(row.faturamentoPeriodo)}
                  </td>
                  <td className={roiClass(row.roiPeriodo)}>{fmtROI(row.roiPeriodo)}</td>
                  <td className={row.quantEnvios >= 100 ? 'envios-alto' : ''}>
                    {row.quantEnvios === 0 ? <span className="badge-zero">0</span> : row.quantEnvios}
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
    </div>
  );
}

export default App;
