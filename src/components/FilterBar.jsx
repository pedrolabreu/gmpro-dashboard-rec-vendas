import { Calendar, Package } from 'lucide-react';
import { PRESETS, toInputVal } from '../utils/date';

// Barra de filtro por produto, compartilhada pelas três abas do dashboard.
export function ProductFilter({ produtos, produtoFiltro, onChange }) {
  return (
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
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
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
