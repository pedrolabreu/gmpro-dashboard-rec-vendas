import { useState, useCallback } from 'react';
import { toInputVal } from '../utils/date';

// Estado + lógica dos presets de período (Hoje/Ontem/7d/14d/30d/Tudo) e dos
// inputs de data manuais, compartilhado pelas três abas do dashboard.
export function useDateRangeFilter(initialPreset = 'Tudo') {
  const [activePreset, setActivePreset] = useState(initialPreset);
  const [startDate, setStartDate]       = useState('');
  const [endDate, setEndDate]           = useState('');

  const applyPreset = useCallback((preset) => {
    setActivePreset(preset.label);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (preset.type === 'today') {
      setStartDate(toInputVal(today)); setEndDate(toInputVal(today)); return;
    }
    if (preset.type === 'yesterday') {
      const ontem = new Date(today); ontem.setDate(ontem.getDate() - 1);
      setStartDate(toInputVal(ontem)); setEndDate(toInputVal(ontem)); return;
    }
    if (!preset.days) { setStartDate(''); setEndDate(''); return; }
    const from = new Date(today);
    from.setDate(from.getDate() - preset.days + 1);
    setStartDate(toInputVal(from));
    setEndDate(toInputVal(today));
  }, []);

  const handleDateChange = useCallback((type, val) => {
    setActivePreset('');
    if (type === 'start') setStartDate(val);
    else setEndDate(val);
  }, []);

  const clear = useCallback(() => applyPreset({ label: 'Tudo', days: null }), [applyPreset]);

  return { activePreset, startDate, endDate, applyPreset, handleDateChange, clear };
}
