import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, HelpCircle, Eye, ArrowRight } from 'lucide-react';
import {
  areEquivalent,
  formatFracText,
  isExactMatch,
  isReduced,
  parseFractionStrings,
} from '../math/fractions';
import type { GuidedStep, PasAPasExercise } from '../types/exercises';
import { ExprView, FracInput, FracView } from './MathDisplay';
import { VisualOperationExplainer } from './FractionVisualizer';

interface StepByStepExerciseProps {
  exercise: PasAPasExercise;
  onComplete: (usedHint: boolean, solvedCleanly: boolean) => void;
  onNext: () => void;
}

interface CompletedStepRecord {
  step: GuidedStep;
  summaryNode: React.ReactNode;
}

export const StepByStepExercise: React.FC<StepByStepExerciseProps> = ({
  exercise,
  onComplete,
  onNext,
}) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [completed, setCompleted] = useState<CompletedStepRecord[]>([]);
  const [finished, setFinished] = useState(false);

  // Inputs for current step
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [singleN, setSingleN] = useState('');
  const [singleD, setSingleD] = useState('');
  const [leftN, setLeftN] = useState('');
  const [leftD, setLeftD] = useState('');
  const [rightN, setRightN] = useState('');
  const [rightD, setRightD] = useState('');

  const [feedback, setFeedback] = useState<{ kind: 'error' | 'info'; message: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showVisual, setShowVisual] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [mistakeCount, setMistakeCount] = useState(0);

  const currentStep = exercise.steps[stepIdx];

  const resetInputs = () => {
    setSelectedChoice('');
    setSingleN('');
    setSingleD('');
    setLeftN('');
    setLeftD('');
    setRightN('');
    setRightD('');
    setFeedback(null);
    setShowHint(false);
  };

  const advanceStep = (summaryNode: React.ReactNode) => {
    const nextCompleted = [...completed, { step: currentStep, summaryNode }];
    setCompleted(nextCompleted);
    resetInputs();

    if (stepIdx + 1 >= exercise.steps.length) {
      setFinished(true);
      onComplete(usedHint, mistakeCount <= 1);
    } else {
      setStepIdx(stepIdx + 1);
    }
  };

  const handleCheck = () => {
    if (!currentStep) return;

    if (currentStep.kind === 'choice') {
      if (!selectedChoice) {
        setFeedback({ kind: 'error', message: 'Selecciona una opció abans de comprovar.' });
        return;
      }
      if (selectedChoice === currentStep.correctOptionId) {
        const chosen = currentStep.options.find((o) => o.id === selectedChoice);
        advanceStep(<span className="font-medium text-slate-900">{chosen?.label}</span>);
      } else {
        setMistakeCount((c) => c + 1);
        setFeedback({
          kind: 'error',
          message: 'Aquesta opció no és correcta. Revisa la pista si et cal un cop de mà.',
        });
      }
      return;
    }

    if (currentStep.kind === 'single_frac') {
      const effectiveD =
        currentStep.expected.d === 1 && singleD.trim() === '' ? '1' : singleD;
      const parsed = parseFractionStrings(singleN, effectiveD);
      if (!parsed) {
        setFeedback({
          kind: 'error',
          message: 'Introdueix nombres enters vàlids (el denominador no pot ser 0).',
        });
        return;
      }

      if (!areEquivalent(parsed, currentStep.expected)) {
        setMistakeCount((c) => c + 1);
        setFeedback({
          kind: 'error',
          message: 'El valor no coincideix. Comprova les operacions i els signes.',
        });
        return;
      }

      if (
        currentStep.requireExactDenominator !== undefined &&
        parsed.d !== currentStep.requireExactDenominator
      ) {
        setFeedback({
          kind: 'info',
          message: `És equivalent, però en aquest pas manté el denominador ${currentStep.requireExactDenominator}.`,
        });
        return;
      }

      if (currentStep.requireReduced && !isReduced(parsed)) {
        setFeedback({
          kind: 'info',
          message:
            'El valor és correcte, però encara es pot simplificar! Expressa-la com a fracció irreductible.',
        });
        return;
      }

      advanceStep(
        <div className="inline-flex items-center gap-2">
          {currentStep.prefixTokens && <ExprView tokens={currentStep.prefixTokens} size="sm" />}
          <FracView fraction={parsed} size="sm" highlight="success" />
          {currentStep.suffixTokens && <ExprView tokens={currentStep.suffixTokens} size="sm" />}
        </div>
      );
      return;
    }

    if (currentStep.kind === 'dual_frac') {
      const dL =
        currentStep.lockDenominators !== undefined
          ? String(currentStep.lockDenominators)
          : leftD;
      const dR =
        currentStep.lockDenominators !== undefined
          ? String(currentStep.lockDenominators)
          : rightD;

      const parsedL = parseFractionStrings(leftN, dL);
      const parsedR = parseFractionStrings(rightN, dR);

      if (!parsedL || !parsedR) {
        setFeedback({
          kind: 'error',
          message: 'Completa totes dues fraccions amb nombres enters vàlids.',
        });
        return;
      }

      const okL = currentStep.requireExactMatch
        ? isExactMatch(parsedL, currentStep.expectedLeft)
        : areEquivalent(parsedL, currentStep.expectedLeft);
      const okR = currentStep.requireExactMatch
        ? isExactMatch(parsedR, currentStep.expectedRight)
        : areEquivalent(parsedR, currentStep.expectedRight);

      if (!okL || !okR) {
        setMistakeCount((c) => c + 1);
        const msg =
          !okL && !okR
            ? 'Revisa totes dues fraccions.'
            : !okL
              ? 'La primera fracció no és correcta; la segona sí!'
              : 'La primera fracció és correcta, però revisa la segona!';
        setFeedback({ kind: 'error', message: msg });
        return;
      }

      advanceStep(
        <div className="inline-flex items-center gap-2">
          <FracView fraction={parsedL} size="sm" highlight="success" />
          <span className="font-mono text-slate-500">{currentStep.op === '-' ? '−' : currentStep.op}</span>
          <FracView fraction={parsedR} size="sm" highlight="success" />
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Expression Display */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-6 py-7 flex flex-col items-center justify-center gap-3">
        <span className="text-xs font-medium text-slate-500">Operació a resoldre</span>
        <ExprView tokens={exercise.expression} size="xl" />
      </div>

      {/* Optional Visual Aid Toggle */}
      {exercise.visualAid && (
        <div>
          <button
            type="button"
            onClick={() => {
              setShowVisual((v) => !v);
              setUsedHint(true);
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>{showVisual ? 'Amaga el model visual' : 'Visualitza el significat amb barres o àrees'}</span>
          </button>
          {showVisual && (
            <div className="mt-3">
              <VisualOperationExplainer
                left={exercise.visualAid.left}
                right={exercise.visualAid.right}
                op={exercise.visualAid.op}
                showResult={finished}
              />
            </div>
          )}
        </div>
      )}

      {/* Completed Steps Trail */}
      {completed.length > 0 && (
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <div className="text-xs font-semibold text-slate-500">Passes completades</div>
          <ol className="space-y-2">
            {completed.map((item, i) => (
              <li
                key={item.step.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-50/50 border border-emerald-200/70 px-4 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-mono text-xs text-emerald-800 tabular-nums">
                    Pas {i + 1}
                  </span>
                  <span className="text-slate-600">{item.step.prompt}</span>
                </div>
                <div className="shrink-0">{item.summaryNode}</div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Active Step or Final Summary */}
      {!finished && currentStep ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-blue-700 font-mono tabular-nums">
              Pas {stepIdx + 1} de {exercise.steps.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setShowHint((h) => !h);
                setUsedHint(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showHint ? 'Amaga la pista' : 'Demana una pista'}</span>
            </button>
          </div>

          <p className="text-base font-medium text-slate-900">{currentStep.prompt}</p>

          {showHint && (
            <div className="rounded-lg bg-amber-50 border border-amber-200/80 px-4 py-3 text-sm text-amber-950">
              {currentStep.hint}
            </div>
          )}

          {/* Step Input Area */}
          {currentStep.kind === 'choice' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentStep.options.map((opt) => {
                const active = selectedChoice === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedChoice(opt.id);
                      setFeedback(null);
                    }}
                    className={`text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      active
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {currentStep.kind === 'single_frac' && (
            <div className="flex flex-wrap items-center justify-center gap-3 py-2">
              {currentStep.prefixTokens && (
                <ExprView tokens={currentStep.prefixTokens} size="lg" />
              )}
              <FracInput
                nValue={singleN}
                dValue={singleD}
                onNChange={(v) => {
                  setSingleN(v);
                  setFeedback(null);
                }}
                onDChange={(v) => {
                  setSingleD(v);
                  setFeedback(null);
                }}
                lockedDenominator={currentStep.requireExactDenominator}
                autoFocus
                onSubmit={handleCheck}
                status={feedback?.kind === 'error' ? 'error' : 'idle'}
              />
              {currentStep.suffixTokens && (
                <ExprView tokens={currentStep.suffixTokens} size="lg" />
              )}
            </div>
          )}

          {currentStep.kind === 'dual_frac' && (
            <div className="flex flex-wrap items-center justify-center gap-4 py-2">
              <FracInput
                nValue={leftN}
                dValue={leftD}
                onNChange={(v) => {
                  setLeftN(v);
                  setFeedback(null);
                }}
                onDChange={(v) => {
                  setLeftD(v);
                  setFeedback(null);
                }}
                lockedDenominator={currentStep.lockDenominators}
                autoFocus
                onSubmit={handleCheck}
                status={feedback?.kind === 'error' ? 'error' : 'idle'}
              />
              <span className="text-2xl font-mono text-slate-500">
                {currentStep.op === '-' ? '−' : currentStep.op}
              </span>
              <FracInput
                nValue={rightN}
                dValue={rightD}
                onNChange={(v) => {
                  setRightN(v);
                  setFeedback(null);
                }}
                onDChange={(v) => {
                  setRightD(v);
                  setFeedback(null);
                }}
                lockedDenominator={currentStep.lockDenominators}
                onSubmit={handleCheck}
                status={feedback?.kind === 'error' ? 'error' : 'idle'}
              />
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

          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={handleCheck}
              className="px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Comprova el pas
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
            <div>
              <p className="text-base font-semibold text-emerald-950">
                Operació completada correctament!
              </p>
              <p className="text-sm text-emerald-800">
                Resultat irreductible: <span className="font-mono font-semibold">{formatFracText(exercise.finalAnswer)}</span>
              </p>
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
