import React, { useState } from 'react';
import {
  applyOp,
  formatFracText,
  gcd,
  lcm,
  scaleToDenominator,
  type Fraction,
  type Operator,
} from '../math/fractions';
import { ExprView, FracView } from './MathDisplay';
import { VisualOperationExplainer } from './FractionVisualizer';

export const VisualLab: React.FC = () => {
  const [n1, setN1] = useState(2);
  const [d1, setD1] = useState(3);
  const [n2, setN2] = useState(1);
  const [d2, setD2] = useState(4);
  const [op, setOp] = useState<Operator>('+');

  const f1: Fraction = { n: n1, d: d1 };
  const f2: Fraction = { n: n2, d: d2 };
  const result = applyOp(f1, op, f2);
  const commonD = lcm(d1, d2);
  const sf1 = scaleToDenominator(f1, commonD);
  const sf2 = scaleToDenominator(f2, commonD);

  const rawProd: Fraction = { n: n1 * n2, d: d1 * d2 };
  const rawDiv: Fraction = { n: n1 * d2, d: d1 * n2 };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
          Laboratori visual de fraccions
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Mou els controls per experimentar amb qualsevol parella de fraccions (denominadors fins a 12) i comprovar alhora el significat geomètric i el càlcul pas a pas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Controls & Visual Canvas */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive Controls */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Fraction 1 Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">Primera fracció</span>
                  <FracView fraction={f1} size="sm" highlight="accent" />
                </div>
                <label className="block space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Numerador</span>
                    <span className="font-mono tabular-nums font-semibold">{n1}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={d1}
                    value={n1}
                    onChange={(e) => setN1(Number(e.target.value))}
                    className="w-full accent-blue-700"
                  />
                </label>
                <label className="block space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Denominador (2 – 12)</span>
                    <span className="font-mono tabular-nums font-semibold">{d1}</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={12}
                    value={d1}
                    onChange={(e) => {
                      const nextD = Number(e.target.value);
                      setD1(nextD);
                      if (n1 > nextD) setN1(nextD);
                    }}
                    className="w-full accent-blue-700"
                  />
                </label>
              </div>

              {/* Fraction 2 Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">Segona fracció</span>
                  <FracView fraction={f2} size="sm" highlight="accent" />
                </div>
                <label className="block space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Numerador</span>
                    <span className="font-mono tabular-nums font-semibold">{n2}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={d2}
                    value={n2}
                    onChange={(e) => setN2(Number(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                </label>
                <label className="block space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Denominador (2 – 12)</span>
                    <span className="font-mono tabular-nums font-semibold">{d2}</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={12}
                    value={d2}
                    onChange={(e) => {
                      const nextD = Number(e.target.value);
                      setD2(nextD);
                      if (n2 > nextD) setN2(nextD);
                    }}
                    className="w-full accent-amber-600"
                  />
                </label>
              </div>
            </div>

            {/* Operator selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-600">Operació</span>
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(['+', '-', '×', '÷'] as Operator[]).map((symbol) => {
                  const active = op === symbol;
                  return (
                    <button
                      key={symbol}
                      type="button"
                      onClick={() => setOp(symbol)}
                      className={`px-4 py-1.5 rounded-md font-mono text-sm font-semibold transition-colors ${
                        active
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {symbol === '-' ? '−' : symbol}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Visual Geometric Representation */}
          <VisualOperationExplainer left={f1} right={f2} op={op} showResult />
        </div>

        {/* Right: Step-by-Step Algebraic Proof */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 space-y-5">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Descomposició pas a pas</h2>
            <FracView fraction={result} size="md" highlight="success" />
          </div>

          <div className="flex items-center justify-center py-2 bg-slate-50 rounded-lg border border-slate-100">
            <ExprView
              tokens={[
                { kind: 'frac', value: f1 },
                { kind: 'op', value: op },
                { kind: 'frac', value: f2 },
              ]}
              size="lg"
            />
          </div>

          {(op === '+' || op === '-') && (
            <ol className="space-y-4 text-sm text-slate-700">
              <li className="space-y-1">
                <p className="font-semibold text-slate-900">
                  1. Calculem el m.c.m.({d1}, {d2}) = {commonD}
                </p>
                <p className="text-slate-600">
                  Busquem parts iguals per poder ajuntar o comparar les fraccions.
                </p>
              </li>
              <li className="space-y-1.5">
                <p className="font-semibold text-slate-900">2. Fraccions equivalents:</p>
                <div className="font-mono text-slate-800 bg-slate-50 rounded-md px-3 py-2">
                  {formatFracText(sf1)} {op === '-' ? '−' : '+'} {formatFracText(sf2)} ={' '}
                  {op === '+' ? sf1.n + sf2.n : sf1.n - sf2.n}/{commonD}
                </div>
              </li>
              <li className="space-y-1">
                <p className="font-semibold text-slate-900">3. Fracció irreductible:</p>
                <p className="text-slate-600">
                  {gcd(op === '+' ? sf1.n + sf2.n : sf1.n - sf2.n, commonD) > 1
                    ? `Dividim numerador i denominador entre ${gcd(
                        op === '+' ? sf1.n + sf2.n : sf1.n - sf2.n,
                        commonD
                      )} i obtenim `
                    : 'Ja no es pot simplificar més: '}
                  <strong className="font-mono text-emerald-700">{formatFracText(result)}</strong>.
                </p>
              </li>
            </ol>
          )}

          {op === '×' && (
            <ol className="space-y-4 text-sm text-slate-700">
              <li className="space-y-1">
                <p className="font-semibold text-slate-900">1. Multipliquem en línia:</p>
                <div className="font-mono text-slate-800 bg-slate-50 rounded-md px-3 py-2">
                  ({n1} × {n2}) / ({d1} × {d2}) = {rawProd.n}/{rawProd.d}
                </div>
              </li>
              <li className="space-y-1">
                <p className="font-semibold text-slate-900">2. Simplifiquem:</p>
                <p className="text-slate-600">
                  {gcd(rawProd.n, rawProd.d) > 1
                    ? `Dividim dalt i baix entre ${gcd(rawProd.n, rawProd.d)} → `
                    : 'Ja és irreductible → '}
                  <strong className="font-mono text-emerald-700">{formatFracText(result)}</strong>.
                </p>
              </li>
            </ol>
          )}

          {op === '÷' && (
            <ol className="space-y-4 text-sm text-slate-700">
              <li className="space-y-1">
                <p className="font-semibold text-slate-900">1. Invertim la segona fracció:</p>
                <div className="font-mono text-slate-800 bg-slate-50 rounded-md px-3 py-2">
                  {n1}/{d1} × {d2}/{n2}
                </div>
              </li>
              <li className="space-y-1">
                <p className="font-semibold text-slate-900">2. Multipliquem en línia:</p>
                <div className="font-mono text-slate-800 bg-slate-50 rounded-md px-3 py-2">
                  ({n1} × {d2}) / ({d1} × {n2}) = {rawDiv.n}/{rawDiv.d}
                </div>
              </li>
              <li className="space-y-1">
                <p className="font-semibold text-slate-900">3. Simplifiquem:</p>
                <p className="text-slate-600">
                  Resultat irreductible:{' '}
                  <strong className="font-mono text-emerald-700">{formatFracText(result)}</strong>.
                </p>
              </li>
            </ol>
          )}
        </div>
      </div>
    </div>
  );
};
