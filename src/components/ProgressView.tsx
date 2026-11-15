import React from 'react';
import { RotateCcw } from 'lucide-react';
import type { Difficulty, ExerciseType, ProgressStats } from '../types/exercises';

interface ProgressViewProps {
  stats: ProgressStats;
  onReset: () => void;
}

const TYPE_LABELS: Record<ExerciseType, string> = {
  pas_a_pas: 'Resolució pas a pas',
  detecta_errada: 'Detecta l’errada',
  nombre_falta: 'Nombre que falta',
  repte_visual: 'Reptes visuals',
};

const DIFF_LABELS: Record<Difficulty, string> = {
  1: 'Nivell 1 (1r ESO)',
  2: 'Nivell 2 (2n ESO)',
  3: 'Nivell 3 (3r–4t ESO)',
};

export const ProgressView: React.FC<ProgressViewProps> = ({ stats, onReset }) => {
  const accuracy =
    stats.totalCompleted > 0
      ? Math.round((stats.cleanCount / stats.totalCompleted) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            Progrés de l’alumnat
          </h1>
          <p className="mt-2 text-slate-600">
            Seguiment local de la sessió: precisió, ratxa d’encerts i domini per tipus d’exercici.
          </p>
        </div>

        {stats.totalCompleted > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reinicia estadístiques</span>
          </button>
        )}
      </div>

      {/* Top KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs text-slate-500">Exercicis completats</div>
          <div className="mt-2 text-3xl font-semibold font-mono tabular-nums text-slate-900">
            {stats.totalCompleted}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs text-slate-500">Resolts a la primera</div>
          <div className="mt-2 text-3xl font-semibold font-mono tabular-nums text-emerald-700">
            {accuracy}%
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs text-slate-500">Ratxa actual</div>
          <div className="mt-2 text-3xl font-semibold font-mono tabular-nums text-blue-700">
            {stats.currentStreak}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs text-slate-500">Millor ratxa</div>
          <div className="mt-2 text-3xl font-semibold font-mono tabular-nums text-slate-900">
            {stats.bestStreak}
          </div>
        </div>
      </div>

      {/* Breakdown by Type and Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Per tipus d’activitat</h2>
          <div className="space-y-3">
            {(Object.keys(TYPE_LABELS) as ExerciseType[]).map((t) => {
              const item = stats.byType[t];
              const pct = item.completed > 0 ? Math.round((item.clean / item.completed) * 100) : 0;
              return (
                <div key={t} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 font-medium">{TYPE_LABELS[t]}</span>
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {item.completed} fets · {pct}% sense errors
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-700 transition-all"
                      style={{ width: `${item.completed > 0 ? Math.max(8, pct) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Per nivell de dificultat</h2>
          <div className="space-y-3">
            {([1, 2, 3] as Difficulty[]).map((d) => {
              const item = stats.byDifficulty[d];
              const pct = item.completed > 0 ? Math.round((item.clean / item.completed) * 100) : 0;
              return (
                <div key={d} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 font-medium">{DIFF_LABELS[d]}</span>
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {item.completed} fets · {pct}% sense errors
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all"
                      style={{ width: `${item.completed > 0 ? Math.max(8, pct) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent History Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Historial recent</h2>
        </div>
        {stats.history.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Encara no has completat cap exercici. Resol el primer a la pestanya Pràctica!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6 font-semibold">Tipus</th>
                  <th className="py-3 px-4 font-semibold">Nivell</th>
                  <th className="py-3 px-4 font-semibold">Detall</th>
                  <th className="py-3 px-6 font-semibold text-right">Valoració</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.history.slice(0, 12).map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-6 font-medium text-slate-900">
                      {TYPE_LABELS[rec.type]}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums">
                      Nivell {rec.difficulty}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{rec.summary}</td>
                    <td className="py-3 px-6 text-right text-xs font-semibold">
                      {rec.solvedCleanly && !rec.usedHint ? (
                        <span className="text-emerald-700">Directe</span>
                      ) : rec.usedHint ? (
                        <span className="text-amber-700">Amb pista</span>
                      ) : (
                        <span className="text-blue-700">Corregit</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
