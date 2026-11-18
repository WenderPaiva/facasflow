import React, { useEffect, useRef, useState } from 'react';
import { formatBRL } from '../utils/financeEngine';

export interface CategoryChartDatum {
  key: string;
  label: string;
  colorHex: string;
  amount: number;
  count: number;
  percentage: number;
}

interface ResponsiveCategoryChartProps {
  items: CategoryChartDatum[];
  total: number;
}

export const ResponsiveCategoryChart: React.FC<ResponsiveCategoryChartProps> = ({
  items,
  total,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>(640);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const update = () => {
      const next = Math.max(260, Math.round(el.getBoundingClientRect().width));
      setWidth(next);
    };
    update();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width);
        if (w > 0) setWidth(Math.max(260, w));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (items.length === 0 || total <= 0) {
    return (
      <div ref={containerRef} className="w-full min-w-0">
        <div className="rounded-2xl bg-white/40 border border-white/60 p-6 text-center text-sm text-slate-600 font-medium">
          Sem despesas ativas no período para exibir no gráfico por categoria.
        </div>
      </div>
    );
  }

  const isCompact = width < 640;
  const maxAmount = Math.max(...items.map((i) => i.amount), 1);
  const svgWidth = Math.max(260, isCompact ? width - 16 : Math.min(540, Math.round(width * 0.56)));
  const barHeight = 22;
  const rowGap = 14;
  const topPad = 8;
  const svgHeight = topPad * 2 + items.length * (barHeight + rowGap) - rowGap;

  return (
    <div
      ref={containerRef}
      className="w-full min-w-0 flex flex-col md:flex-row md:items-start gap-5"
    >
      {/* Responsive SVG Bar Chart sized by ResizeObserver */}
      <div className="w-full md:w-[58%] min-w-0">
        <svg
          width="100%"
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          role="img"
          aria-label="Gráfico de despesas por categoria"
          className="overflow-visible block"
        >
          {items.map((item, idx) => {
            const y = topPad + idx * (barHeight + rowGap);
            const trackW = Math.max(80, svgWidth - 8);
            const barW = Math.max(6, Math.round((item.amount / maxAmount) * trackW));
            return (
              <g key={item.key}>
                <title>
                  {`${item.label}: ${formatBRL(item.amount)} (${item.percentage.toFixed(1)}%)`}
                </title>
                <rect
                  x={0}
                  y={y}
                  width={trackW}
                  height={barHeight}
                  rx={11}
                  fill="rgba(255,255,255,0.65)"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={1}
                />
                <rect
                  x={0}
                  y={y}
                  width={barW}
                  height={barHeight}
                  rx={11}
                  fill={item.colorHex}
                />
                <text
                  x={barW > 74 ? 10 : barW + 8}
                  y={y + 15}
                  fontSize={11}
                  fontWeight={700}
                  fill={barW > 74 ? '#ffffff' : '#1e293b'}
                  style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
                >
                  {item.percentage.toFixed(1)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legends stacked below chart on mobile (<768px), beside on desktop */}
      <div className="w-full md:w-[42%] min-w-0 space-y-2">
        {items.map((item) => (
          <div
            key={item.key}
            title={`${item.label} — ${item.count} lançamento(s)`}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-white/55 border border-white/75 min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.colorHex }}
              />
              <span className="text-xs font-bold text-slate-900 truncate">
                {item.label}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                ({item.count})
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-mono font-extrabold text-slate-900 block">
                {formatBRL(item.amount)}
              </span>
              <span className="text-[10px] font-bold text-slate-600">
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
