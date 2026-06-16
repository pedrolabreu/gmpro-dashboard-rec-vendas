// Tooltip do Recharts compartilhado pelos três dashboards.
// `formatValue(name, value)` decide como cada série é exibida; por padrão
// mostra o valor cru (usado para contagens como Vendas/Envios/Qtd).
export default function ChartTooltip({ active, payload, label, formatValue = (_, v) => v }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#666', marginBottom: 6, fontSize: 11 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{formatValue(p.name, p.value)}</strong>
        </p>
      ))}
    </div>
  );
}
