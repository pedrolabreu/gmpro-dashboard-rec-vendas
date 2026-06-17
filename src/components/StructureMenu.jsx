import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const OPTIONS = [
  { value: 'recuperacao', label: 'Recuperação' },
  { value: 'geral',       label: 'Geral' },
];

export default function StructureMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const current = OPTIONS.find(o => o.value === value) ?? OPTIONS[0];

  return (
    <div className="structure-menu" ref={ref}>
      <button className="structure-menu-btn" onClick={() => setOpen(o => !o)}>
        {current.label}
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div className="structure-menu-dropdown">
          {OPTIONS.map(o => (
            <button
              key={o.value}
              className={`structure-menu-item ${o.value === value ? 'active' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
              {o.value === value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
