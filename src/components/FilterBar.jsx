import { Calendar, Package, Workflow, Tag } from 'lucide-react';
import { PRESETS, toInputVal } from '../utils/date';

// Barra de filtro por opções (tags), genérica — base do ProductFilter e OperationFilter.
function TagFilter({ icon, label, options, value, onChange }) {
  return (
    <div className="date-filter" style={{ marginBottom: 10 }}>
      <div className="date-filter-left">
        {icon}
        <span className="date-filter-label">{label}:</span>
      </div>
      <div className="date-filter-right">
        <div className="preset-group">
          {options.map(o => (
            <button
              key={o}
              className={`preset-btn ${value === o ? 'active' : ''}`}
              onClick={() => onChange(o)}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Barra de filtro por produto, compartilhada pelas três abas do dashboard.
export function ProductFilter({ produtos, produtoFiltro, onChange }) {
  return (
    <TagFilter
      icon={<Package size={14} color="#cc0000" />}
      label="Produto"
      options={produtos}
      value={produtoFiltro}
      onChange={onChange}
    />
  );
}

// Barra de filtro por operação (coluna K da planilha SALES CONTROL), usada na estrutura Geral.
export function OperationFilter({ operacoes, operacaoFiltro, onChange }) {
  return (
    <TagFilter
      icon={<Workflow size={14} color="#cc0000" />}
      label="Operação"
      options={operacoes}
      value={operacaoFiltro}
      onChange={onChange}
    />
  );
}

// Barra de filtro por oferta (coluna G da planilha SALES CONTROL), usada na estrutura Geral.
export function OfertaFilter({ ofertas, ofertaFiltro, onChange }) {
  return (
    <TagFilter
      icon={<Tag size={14} color="#cc0000" />}
      label="Oferta"
      options={ofertas}
      value={ofertaFiltro}
      onChange={onChange}
    />
  );
}

// Barra de filtro por período (presets + inputs de data), compartilhada
// pelas três abas do dashboard.
export function PeriodFilter({
  periodoLabel, activePreset, startDate, endDate, onApplyPreset, onDateChange, onClear,
}) {
  return (
    <div className="date-filter">
      <div className="date-filter-left">
        <Calendar size={14} color="#cc0000" />
        <span className="date-filter-label">Período:</span>
        <span className="date-filter-period">{periodoLabel}</span>
      </div>
      <div className="date-filter-right">
        <div className="preset-group">
          {PRESETS.map(p => (
            <button
              key={p.label}
              className={`preset-btn ${activePreset === p.label ? 'active' : ''}`}
              onClick={() => onApplyPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="date-inputs">
          <div className="date-input-wrap">
            <input
              type="date"
              className="date-input"
              value={startDate}
              max={endDate || toInputVal(new Date())}
              onChange={e => onDateChange('start', e.target.value)}
            />
          </div>
          <span style={{ color: '#333', fontSize: 12 }}>→</span>
          <div className="date-input-wrap">
            <input
              type="date"
              className="date-input"
              value={endDate}
              min={startDate || ''}
              onChange={e => onDateChange('end', e.target.value)}
            />
          </div>
        </div>
        {(startDate || endDate) && (
          <button className="clear-btn" onClick={onClear}>
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}
