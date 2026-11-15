import React from 'react';
import { add, div, lcm, mul, scaleToDenominator, sub, type Fraction, type Operator } from '../math/fractions';

interface FractionBarProps {
  fraction: Fraction;
  subdivideTo?: number;
  accentColor?: 'blue' | 'amber' | 'emerald';
  label?: string;
}

export const FractionStripSVG: React.FC<FractionBarProps> = ({
  fraction,
  subdivideTo,
  accentColor = 'blue',
  label,
}) => {
  const totalParts = subdivideTo ?? fraction.d;
  const filledParts = subdivideTo
    ? scaleToDenominator(fraction, subdivideTo).n
    : fraction.n;

  const palette = {
    blue: { fill: '#1D4ED8', soft: '#DBEAFE', stroke: '#93C5FD' },
    amber: { fill: '#D97706', soft: '#FEF3C7', stroke: '#FCD34D' },
    emerald: { fill: '#059669', soft: '#D1FAE5', stroke: '#6EE7B7' },
  }[accentColor];

  const width = 440;
  const height = 44;
  const cellW = width / totalParts;
  const originalStep = totalParts / fraction.d;

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
          <span>{label}</span>
          <span className="font-mono tabular-nums text-slate-800">
            {filledParts}/{totalParts}
          </span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-11 rounded-lg border border-slate-200 bg-white overflow-hidden"
        role="img"
        aria-label={`Barra fraccionària de ${filledParts} parts de ${totalParts}`}
      >
        {Array.from({ length: totalParts }).map((_, idx) => {
          const isFilled = idx < Math.max(0, Math.min(totalParts, filledParts));
          const isOriginalBoundary = subdivideTo && idx > 0 && idx % originalStep === 0;
          return (
            <g key={idx}>
              <rect
                x={idx * cellW}
                y={0}
                width={cellW}
                height={height}
                fill={isFilled ? palette.fill : '#FFFFFF'}
                fillOpacity={isFilled ? 0.85 : 1}
                stroke={isFilled ? '#FFFFFF' : '#CBD5E1'}
                strokeWidth={1}
              />
              {isOriginalBoundary && (
                <line
                  x1={idx * cellW}
                  y1={0}
                  x2={idx * cellW}
                  y2={height}
                  stroke="#0F172A"
                  strokeWidth={2}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

interface AreaModelProps {
  left: Fraction;
  right: Fraction;
}

export const AreaMultiplicationSVG: React.FC<AreaModelProps> = ({ left, right }) => {
  const rows = left.d;
  const cols = right.d;
  const width = 260;
  const height = 220;
  const padLeft = 36;
  const padTop = 28;
  const gridW = width - padLeft - 12;
  const gridH = height - padTop - 16;
  const cellW = gridW / cols;
  const cellH = gridH / rows;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-[280px] mx-auto"
      role="img"
      aria-label={`Model d'àrea de ${left.n}/${left.d} per ${right.n}/${right.d}`}
    >
      {/* Top label (cols) */}
      <text
        x={padLeft + gridW / 2}
        y={16}
        textAnchor="middle"
        className="fill-amber-700 font-mono text-[12px] font-semibold"
      >
        {right.n}/{right.d} (columnes)
      </text>
      {/* Left label (rows) */}
      <text
        x={14}
        y={padTop + gridH / 2}
        textAnchor="middle"
        transform={`rotate(-90 14 ${padTop + gridH / 2})`}
        className="fill-blue-700 font-mono text-[12px] font-semibold"
      >
        {left.n}/{left.d} (files)
      </text>

      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => {
          const inA = r < left.n;
          const inB = c < right.n;
          const both = inA && inB;

          let fill = '#F8FAFC';
          if (both) fill = '#059669';
          else if (inA) fill = '#DBEAFE';
          else if (inB) fill = '#FEF3C7';

          return (
            <rect
              key={`${r}-${c}`}
              x={padLeft + c * cellW}
              y={padTop + r * cellH}
              width={cellW}
              height={cellH}
              fill={fill}
              stroke="#94A3B8"
              strokeWidth={1}
            />
          );
        })
      )}
      <rect
        x={padLeft}
        y={padTop}
        width={gridW}
        height={gridH}
        fill="none"
        stroke="#0F172A"
        strokeWidth={1.75}
        rx={2}
      />
    </svg>
  );
};

interface VisualOperationExplainerProps {
  left: Fraction;
  right: Fraction;
  op: Operator;
  showResult?: boolean;
}

export const VisualOperationExplainer: React.FC<VisualOperationExplainerProps> = ({
  left,
  right,
  op,
  showResult = true,
}) => {
  const commonD = lcm(left.d, right.d);

  if (op === '×') {
    const prod = mul(left, right);
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-800">Model geomètric d’àrea</span>
          <span>
            {left.n * right.n} cel·les comunes de {left.d * right.d} totals
          </span>
        </div>
        <AreaMultiplicationSVG left={left} right={right} />
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-300" />
            {left.n}/{left.d}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" />
            {right.n}/{right.d}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-600" />
            Encreuament = {showResult ? `${prod.n}/${prod.d}` : '?'}
          </span>
        </div>
      </div>
    );
  }

  if (op === '÷') {
    const sLeft = scaleToDenominator(left, commonD);
    const sRight = scaleToDenominator(right, commonD);
    const res = div(left, right);

    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-800">
            Quantes vegades cap {right.n}/{right.d} dins de {left.n}/{left.d}?
          </span>
          <span className="font-mono tabular-nums">Comú denominador: {commonD}</span>
        </div>
        <FractionStripSVG
          fraction={left}
          subdivideTo={commonD}
          accentColor="blue"
          label={`Dividend: ${left.n}/${left.d} = ${sLeft.n}/${commonD}`}
        />
        <FractionStripSVG
          fraction={right}
          subdivideTo={commonD}
          accentColor="amber"
          label={`Divisor (mida del pas): ${right.n}/${right.d} = ${sRight.n}/${commonD}`}
        />
        {showResult && (
          <p className="text-xs text-slate-600 pt-1">
            Comparem {sLeft.n} unitats d’{commonD} amb grups de {sRight.n} unitats: hi caben{' '}
            <span className="font-mono font-semibold text-slate-900">
              {sLeft.n}/{sRight.n} = {res.n}/{res.d}
            </span>{' '}
            vegades.
          </p>
        )}
      </div>
    );
  }

  // + or -
  const sLeft = scaleToDenominator(left, commonD);
  const sRight = scaleToDenominator(right, commonD);
  const result = op === '+' ? add(left, right) : sub(left, right);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">
          Subdivisió al mateix denominador (m.c.m. = {commonD})
        </span>
        <span>Les línies negres marquen els talls originals</span>
      </div>
      <FractionStripSVG
        fraction={left}
        subdivideTo={commonD}
        accentColor="blue"
        label={`Primera fracció: ${left.n}/${left.d} → ${sLeft.n}/${commonD}`}
      />
      <FractionStripSVG
        fraction={right}
        subdivideTo={commonD}
        accentColor="amber"
        label={`Segona fracció: ${right.n}/${right.d} → ${sRight.n}/${commonD}`}
      />
      {showResult && result.n >= 0 && result.n <= result.d && (
        <FractionStripSVG
          fraction={result}
          subdivideTo={commonD}
          accentColor="emerald"
          label={`Resultat (${op === '+' ? 'suma' : 'diferència'}): ${
            op === '+' ? sLeft.n + sRight.n : sLeft.n - sRight.n
          }/${commonD} = ${result.n}/${result.d}`}
        />
      )}
    </div>
  );
};
