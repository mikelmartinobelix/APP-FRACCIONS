import React, { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Search } from 'lucide-react';
import {
  areEquivalent,
  formatFracText,
  isReduced,
  parseFractionStrings,
} from '../math/fractions';
import type { DetectaErradaExercise } from '../types/exercises';
import { ExprView, FracInput } from './MathDisplay';

interface ErrorDetectionExerciseProps {
  exercise: DetectaErradaExercise;
  onComplete: (usedHint: boolean, solvedCleanly: boolean) => void;
  onNext: () => void;
}

export const ErrorDetectionExercise: React.FC<ErrorDetectionExerciseProps> = ({
  exercise,
  onComplete,
  onNext,
}) => {
  const [stage, setStage] = useState<'locate' | 'explain' | 'fix' | 'done'>('locate');
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [fixN, setFixN] = useState('');
  const [fixD, setFixD] = useState('');
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'info'; message: string } | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const handleSelectLine = (idx: number) => {
    if (stage !== 'locate') return;
    setSelectedLine(idx);
    if (idx === exercise.errorLineIndex) {
      setFeedback(null);
      setStage('explain');
    } else {
      setMistakes((m) => m + 1);
      setFeedback({
        kind: 'error',
        message: `El pas ${idx + 1} no conté l'errada principal. Observa amb atenció on es trenca la regla matemàtica.`,
      });
    }
  };

  const handleConfirmReason = () => {
    if (!selectedReason) {
      setFeedback({ kind: 'error', message: 'Tria l’explicació que descriu millor l’errada.' });
      return;
    }
    if (selectedReason === exercise.correctReasonId) {
      setFeedback(null);
      setStage('fix');
    } else {
      setMistakes((m) => m + 1);
      setFeedback({
        kind: 'error',
        message: 'Aquesta explicació no correspon al que ha fet en aquest pas. Torna-ho a llegir.',
      });
    }
  };

  const handleCheckFix = () => {
    const effectiveD =
      exercise.correctFinalAnswer.d === 1 && fixD.trim() === '' ? '1' : fixD;
    if (fixN.trim() === '' || effectiveD.trim() === '') {
      setFeedback({
        kind: 'error',
        message: 'Completa tant el numerador com el denominador abans de comprovar.',
      });
      return;
    }
    const parsed = parseFractionStrings(fixN, effectiveD);
    if (!parsed) {
      setFeedback({
        kind: 'error',
        message: 'Introdueix una fracció vàlida amb nombres enters (el denominador no pot ser 0).',
      });
      return;
    }
    if (!areEquivalent(parsed, exercise.correctFinalAnswer)) {
      setMistakes((m) => m + 1);
      setFeedback({
        kind: 'error',
        message: 'Encara no coincideix amb el resultat correcte de l’operació original.',
      });
      return;
    }
    if (!isReduced(parsed)) {
      setFeedback({
        kind: 'info',
        message: 'És equivalent, però simplifica-la fins a obtenir la fracció irreductible.',
      });
      return;
    }
    setFeedback(null);
    setStage('done');
    onComplete(false, mistakes <= 1);
  };

  return (
    <div className="space-y-6">
      {/* Original problem + student's notebook */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <span className="text-xs font-semibold text-slate-700">
            Resolució del quadern de {exercise.studentName}
          </span>
          <span className="text-xs text-slate-500">Hi ha una errada en un dels passos</span>
        </div>

        <div className="flex flex-wrap items-center justify-center py-2">
          <ExprView tokens={exercise.expression} size="lg" />
        </div>

        <div className="space-y-2.5">
          {exercise.workedLines.map((line, idx) => {
            const isFoundError = stage !== 'locate' && idx === exercise.errorLineIndex;
            const isWrongPick = stage === 'locate' && selectedLine === idx && idx !== exercise.errorLineIndex;

            return (
              <button
                key={line.stepNumber}
                type="button"
                disabled={stage !== 'locate'}
                onClick={() => handleSelectLine(idx)}
                className={`w-full text-left rounded-lg border px-4 py-3.5 transition-colors flex flex-wrap items-center justify-between gap-4 ${
                  isFoundError
                    ? 'border-amber-400 bg-amber-50/70'
                    : isWrongPick
                      ? 'border-red-300 bg-red-50/50'
                      : stage === 'locate'
                        ? 'border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer'
                        : 'border-slate-200 bg-white/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-slate-500 tabular-nums">
                    Pas {line.stepNumber}
                  </span>
                  <span className="text-sm text-slate-700">{line.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400">=</span>
                  <ExprView
                    tokens={line.tokens}
                    size="md"
                    highlight={isFoundError ? 'error' : 'none'}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Stages */}
      {stage === 'locate' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-700 shrink-0" />
          <p className="text-sm font-medium text-slate-800">
            1. Fes clic sobre el pas del quadern on {exercise.studentName} ha comès l’errada.
          </p>
        </div>
      )}

      {stage === 'explain' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Molt bé! L’errada és al Pas {exercise.errorLineIndex + 1}. Ara explica per què és incorrecte:
            </span>
          </div>
          <div className="space-y-2">
            {exercise.reasonOptions.map((opt) => {
              const active = selectedReason === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSelectedReason(opt.id);
                    setFeedback(null);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                    active
                      ? 'border-blue-600 bg-blue-50 text-blue-950 font-medium'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleConfirmReason}
              className="px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Valida l’explicació
            </button>
          </div>
        </div>
      )}

      {stage === 'fix' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <p className="text-sm font-medium text-slate-900">
            3. Perfecte! Ara calcula tu el resultat correcte i irreductible de l’operació inicial:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 py-2">
            <ExprView tokens={exercise.expression} size="lg" />
            <span className="text-2xl font-mono text-slate-500">=</span>
            <FracInput
              nValue={fixN}
              dValue={fixD}
              onNChange={(v) => {
                setFixN(v);
                setFeedback(null);
              }}
              onDChange={(v) => {
                setFixD(v);
                setFeedback(null);
              }}
              autoFocus
              onSubmit={handleCheckFix}
              status={feedback?.kind === 'error' ? 'error' : 'idle'}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCheckFix}
              className="px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Comprova la correcció
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div
          role="alert"
          className={`flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm ${
            feedback.kind === 'error'
              ? 'bg-red-50 border border-red-200 text-red-900'
              : 'bg-amber-50 border border-amber-200 text-amber-950'
          }`}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {stage === 'done' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-emerald-950">
                Errada detectada i corregida ({formatFracText(exercise.correctFinalAnswer)})!
              </p>
              <p className="text-sm text-emerald-800">{exercise.explanationSummary}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <span>Següent exercici</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
