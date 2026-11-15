import React, { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, HelpCircle } from 'lucide-react';
import { formatFracText } from '../math/fractions';
import type { NombreFaltaExercise } from '../types/exercises';
import { FracView } from './MathDisplay';
import { VisualOperationExplainer } from './FractionVisualizer';

interface MissingNumberExerciseProps {
  exercise: NombreFaltaExercise;
  onComplete: (usedHint: boolean, solvedCleanly: boolean) => void;
  onNext: () => void;
}

export const MissingNumberExercise: React.FC<MissingNumberExerciseProps> = ({
  exercise,
  onComplete,
  onNext,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showVisual, setShowVisual] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  const handleCheck = () => {
    const trimmed = inputVal.trim();
    const num = Number(trimmed);
    if (trimmed === '' || !Number.isInteger(num)) {
      setFeedback('Escriu un nombre enter vàlid dins de la casella.');
      return;
    }

    if (exercise.missingTarget === 'd' && (num <= 0 || num > exercise.maxAllowedDenominator)) {
      setFeedback(
        `En aquest exercici busquem un denominador positiu entre 1 i ${exercise.maxAllowedDenominator}.`
      );
      return;
    }

    if (num === exercise.expectedValue) {
      setFeedback(null);
      setSolved(true);
      onComplete(usedHint, mistakes <= 1);
    } else {
      setMistakes((m) => m + 1);
      setFeedback(
        `Amb ${num} la igualtat no es compleix. Prova de desfer l'operació des del resultat ${formatFracText(
          exercise.rightResult
        )}.`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Equation Display with embedded missing box */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-6 py-8 flex flex-col items-center gap-4">
        <span className="text-xs font-medium text-slate-500">
          Troba el nombre que falta perquè la igualtat sigui certa
        </span>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {exercise.leftSide.map((item, idx) => {
            if (item.kind === 'op') {
              return (
                <span key={idx} className="font-mono text-2xl text-slate-500 mx-1">
                  {item.value === '-' ? '−' : item.value}
                </span>
              );
            }
            if (item.kind === 'paren') {
              return (
                <span key={idx} className="font-sans text-4xl font-light text-slate-400">
                  {item.value}
                </span>
              );
            }

            // Fraction with possible missing numerator or denominator
            if (item.highlightMissing) {
              return (
                <div key={idx} className="inline-flex flex-col items-center w-16">
                  {item.highlightMissing === 'n' ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label="Numerador que falta"
                      placeholder="□"
                      value={inputVal}
                      disabled={solved}
                      autoFocus
                      onChange={(e) => {
                        setInputVal(e.target.value.replace(/[^0-9-]/g, ''));
                        setFeedback(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCheck();
                      }}
                      className={`w-14 h-11 text-center font-mono text-xl font-bold tabular-nums rounded-lg border-2 outline-none transition-colors ${
                        solved
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                          : feedback
                            ? 'border-red-500 bg-red-50 text-red-900'
                            : 'border-blue-600 bg-white text-blue-900 focus:ring-2 focus:ring-blue-600/20'
                      }`}
                    />
                  ) : (
                    <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums py-1">
                      {item.n}
                    </span>
                  )}

                  <div className="w-full h-[2.5px] bg-slate-800 my-1.5 rounded-full" />

                  {item.highlightMissing === 'd' ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label="Denominador que falta"
                      placeholder="□"
                      value={inputVal}
                      disabled={solved}
                      autoFocus
                      onChange={(e) => {
                        setInputVal(e.target.value.replace(/[^0-9]/g, ''));
                        setFeedback(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCheck();
                      }}
                      className={`w-14 h-11 text-center font-mono text-xl font-bold tabular-nums rounded-lg border-2 outline-none transition-colors ${
                        solved
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                          : feedback
                            ? 'border-red-500 bg-red-50 text-red-900'
                            : 'border-blue-600 bg-white text-blue-900 focus:ring-2 focus:ring-blue-600/20'
                      }`}
                    />
                  ) : (
                    <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums py-1">
                      {item.d}
                    </span>
                  )}
                </div>
              );
            }

            return (
              <FracView
                key={idx}
                fraction={{ n: item.n ?? 1, d: item.d ?? 1 }}
                size="lg"
              />
            );
          })}

          <span className="font-mono text-2xl text-slate-500 mx-1.5">=</span>
          <FracView fraction={exercise.rightResult} size="lg" highlight="accent" />
        </div>
      </div>

      {/* Tools Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setShowHint((h) => !h);
              setUsedHint(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{showHint ? 'Amaga l’estratègia' : 'Pista d’estratègia inversa'}</span>
          </button>

          {exercise.visualData && (
            <button
              type="button"
              onClick={() => {
                setShowVisual((v) => !v);
                setUsedHint(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>{showVisual ? 'Amaga la balança visual' : 'Mostra balança visual'}</span>
            </button>
          )}
        </div>

        {!solved && (
          <button
            type="button"
            onClick={handleCheck}
            className="px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            Comprova el nombre
          </button>
        )}
      </div>

      {showHint && (
        <div className="rounded-lg bg-amber-50 border border-amber-200/80 px-4 py-3 text-sm text-amber-950">
          {exercise.stepHintText}
        </div>
      )}

      {showVisual && exercise.visualData && (
        <VisualOperationExplainer
          left={exercise.visualData.missingFrac}
          right={exercise.visualData.knownFrac}
          op={exercise.visualData.op}
          showResult={solved}
        />
      )}

      {feedback && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-900"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {solved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
            <div>
              <p className="text-base font-semibold text-emerald-950">
                Correcte! El nombre que faltava era el{' '}
                <span className="font-mono">{exercise.expectedValue}</span>.
              </p>
              <p className="text-sm text-emerald-800">{exercise.stepHintText}</p>
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
