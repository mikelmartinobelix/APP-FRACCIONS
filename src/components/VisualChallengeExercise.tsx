import React, { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, HelpCircle, Image as ImageIcon } from 'lucide-react';
import {
  areEquivalent,
  formatFracText,
  isExactMatch,
  isReduced,
  parseFractionStrings,
} from '../math/fractions';
import type { RepteVisualExercise } from '../types/exercises';
import { ExprView, FracInput, FracView } from './MathDisplay';

interface VisualChallengeExerciseProps {
  exercise: RepteVisualExercise;
  onComplete: (usedHint: boolean, solvedCleanly: boolean) => void;
  onNext: () => void;
}

export const VisualChallengeExercise: React.FC<VisualChallengeExerciseProps> = ({
  exercise,
  onComplete,
  onNext,
}) => {
  const { challenge } = exercise;

  if (challenge.variant === 'image_context') {
    return (
      <ImageContextRunner
        challenge={challenge}
        onComplete={onComplete}
        onNext={onNext}
      />
    );
  }

  if (challenge.variant === 'area_grid_builder') {
    return (
      <AreaGridBuilderRunner
        challenge={challenge}
        onComplete={onComplete}
        onNext={onNext}
      />
    );
  }

  return (
    <StripBuilderRunner
      challenge={challenge}
      onComplete={onComplete}
      onNext={onNext}
    />
  );
};

// ---------------------------------------------------------------------------
// 1. IMAGE CONTEXT RUNNER
// ---------------------------------------------------------------------------

const ImageContextRunner: React.FC<{
  challenge: Extract<RepteVisualExercise['challenge'], { variant: 'image_context' }>;
  onComplete: (usedHint: boolean, solvedCleanly: boolean) => void;
  onNext: () => void;
}> = ({ challenge, onComplete, onNext }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  const [completedSummaries, setCompletedSummaries] = useState<
    { prompt: string; node: React.ReactNode }[]
  >([]);

  const [singleN, setSingleN] = useState('');
  const [singleD, setSingleD] = useState('');
  const [leftN, setLeftN] = useState('');
  const [leftD, setLeftD] = useState('');
  const [rightN, setRightN] = useState('');
  const [rightD, setRightD] = useState('');

  const [showHint, setShowHint] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'info'; message: string } | null>(null);

  const currentStep = challenge.steps[stepIdx];

  const resetInputs = () => {
    setSingleN('');
    setSingleD('');
    setLeftN('');
    setLeftD('');
    setRightN('');
    setRightD('');
    setShowHint(false);
    setFeedback(null);
  };

  const advance = (node: React.ReactNode) => {
    setCompletedSummaries((prev) => [...prev, { prompt: currentStep.prompt, node }]);
    resetInputs();
    if (stepIdx + 1 >= challenge.steps.length) {
      setFinished(true);
      onComplete(usedHint, mistakes <= 1);
    } else {
      setStepIdx(stepIdx + 1);
    }
  };

  const handleCheck = () => {
    if (!currentStep) return;

    if (currentStep.kind === 'single_frac') {
      const effectiveD =
        currentStep.requireExactDenominator !== undefined
          ? String(currentStep.requireExactDenominator)
          : currentStep.expected.d === 1 && singleD.trim() === ''
            ? '1'
            : singleD;
      if (singleN.trim() === '' || effectiveD.trim() === '') {
        setFeedback({ kind: 'error', message: 'Completa el numerador i el denominador.' });
        return;
      }
      const parsed = parseFractionStrings(singleN, effectiveD);
      if (!parsed) {
        setFeedback({ kind: 'error', message: 'Escriu una fracció vàlida (el denominador no pot ser 0).' });
        return;
      }
      if (!areEquivalent(parsed, currentStep.expected)) {
        setMistakes((m) => m + 1);
        setFeedback({
          kind: 'error',
          message: 'Aquesta fracció no coincideix amb la situació del problema.',
        });
        return;
      }
      if (
        currentStep.requireExactDenominator !== undefined &&
        parsed.n !== 0 &&
        parsed.d !== currentStep.requireExactDenominator
      ) {
        setFeedback({
          kind: 'info',
          message: `És equivalent, però manté el denominador ${currentStep.requireExactDenominator}.`,
        });
        return;
      }
      if (currentStep.requireReduced && !isReduced(parsed)) {
        setFeedback({
          kind: 'info',
          message: 'És equivalent, però expressa-la com a fracció irreductible!',
        });
        return;
      }
      advance(<FracView fraction={parsed} size="sm" highlight="success" />);
      return;
    }

    if (currentStep.kind === 'dual_frac') {
      const dL =
        currentStep.lockDenominators !== undefined
          ? String(currentStep.lockDenominators)
          : currentStep.expectedLeft.d === 1 && leftD.trim() === ''
            ? '1'
            : leftD;
      const dR =
        currentStep.lockDenominators !== undefined
          ? String(currentStep.lockDenominators)
          : currentStep.expectedRight.d === 1 && rightD.trim() === ''
            ? '1'
            : rightD;
      if (
        leftN.trim() === '' ||
        dL.trim() === '' ||
        rightN.trim() === '' ||
        dR.trim() === ''
      ) {
        setFeedback({ kind: 'error', message: 'Completa tots els requadres de les dues fraccions.' });
        return;
      }
      const parsedL = parseFractionStrings(leftN, dL);
      const parsedR = parseFractionStrings(rightN, dR);

      if (!parsedL || !parsedR) {
        setFeedback({ kind: 'error', message: 'Introdueix nombres enters vàlids (el denominador no pot ser 0).' });
        return;
      }

      const okL = currentStep.requireExactMatch
        ? isExactMatch(parsedL, currentStep.expectedLeft)
        : areEquivalent(parsedL, currentStep.expectedLeft);
      const okR = currentStep.requireExactMatch
        ? isExactMatch(parsedR, currentStep.expectedRight)
        : areEquivalent(parsedR, currentStep.expectedRight);

      if (!okL || !okR) {
        setMistakes((m) => m + 1);
        setFeedback({ kind: 'error', message: 'Revisa els valors comptats a la imatge.' });
        return;
      }

      advance(
        <div className="inline-flex items-center gap-2">
          <FracView fraction={parsedL} size="sm" highlight="success" />
          <span className="font-mono text-slate-500">{currentStep.op}</span>
          <FracView fraction={parsedR} size="sm" highlight="success" />
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        <div className="md:col-span-5 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden flex flex-col">
          {!imgFailed ? (
            <img
              src={challenge.imageUrl}
              alt={challenge.imageAlt}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full aspect-[4/3] object-cover"
            />
          ) : (
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-slate-100 to-blue-50 flex flex-col items-center justify-center p-4 text-center text-slate-600 gap-2">
              <ImageIcon className="w-8 h-8 text-blue-700" />
              <span className="text-xs font-medium">{challenge.imageCaption}</span>
            </div>
          )}
          <div className="px-3.5 py-2.5 bg-white border-t border-slate-200 text-xs text-slate-600">
            {challenge.imageCaption}
          </div>
        </div>

        <div className="md:col-span-7 rounded-xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col justify-center">
          <p className="text-xs font-semibold text-blue-700 mb-2">Situació contextual</p>
          <p className="text-[15px] leading-relaxed text-slate-800">{challenge.story}</p>
        </div>
      </div>

      {completedSummaries.length > 0 && (
        <ol className="space-y-2">
          {completedSummaries.map((item, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50/50 border border-emerald-200/70 px-4 py-2.5 text-sm"
            >
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{item.prompt}</span>
              </div>
              {item.node}
            </li>
          ))}
        </ol>
      )}

      {!finished && currentStep ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold font-mono text-blue-700 tabular-nums">
              Pas {stepIdx + 1} de {challenge.steps.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setShowHint((h) => !h);
                setUsedHint(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showHint ? 'Amaga la pista' : 'Pista'}</span>
            </button>
          </div>

          <p className="text-base font-medium text-slate-900">{currentStep.prompt}</p>

          {showHint && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-950">
              {currentStep.hint}
            </div>
          )}

          {currentStep.kind === 'single_frac' && (
            <div className="flex items-center justify-center py-2">
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
              />
              <span className="font-mono text-2xl text-slate-500">{currentStep.op}</span>
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

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCheck}
              className="px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Comprova
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
            <div>
              <p className="text-base font-semibold text-emerald-950">
                Repte visual resolt ({formatFracText(challenge.finalAnswer)})!
              </p>
              <p className="text-sm text-emerald-800">
                Has connectat correctament la situació real amb el càlcul fraccionari.
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

// ---------------------------------------------------------------------------
// 2. INTERACTIVE AREA GRID BUILDER (MULTIPLICATION)
// ---------------------------------------------------------------------------

const AreaGridBuilderRunner: React.FC<{
  challenge: Extract<RepteVisualExercise['challenge'], { variant: 'area_grid_builder' }>;
  onComplete: (usedHint: boolean, solvedCleanly: boolean) => void;
  onNext: () => void;
}> = ({ challenge, onComplete, onNext }) => {
  const [selectedRows, setSelectedRows] = useState(0);
  const [selectedCols, setSelectedCols] = useState(0);
  const [ansN, setAnsN] = useState('');
  const [ansD, setAnsD] = useState('');
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'info'; message: string } | null>(null);
  const [solved, setSolved] = useState(false);

  const handleCheck = () => {
    const visualCorrect =
      selectedRows === challenge.targetA.n && selectedCols === challenge.targetB.n;
    if (!visualCorrect) {
      setMistakes((m) => m + 1);
      setFeedback({
        kind: 'error',
        message: `Ajusta primer la graella: marca ${challenge.targetA.n} de les ${challenge.rows} files i ${challenge.targetB.n} de les ${challenge.cols} columnes.`,
      });
      return;
    }

    const effectiveD =
      challenge.finalAnswer.d === 1 && ansD.trim() === '' ? '1' : ansD;
    if (ansN.trim() === '' || effectiveD.trim() === '') {
      setFeedback({ kind: 'error', message: 'Escriu el numerador i el denominador de la fracció.' });
      return;
    }
    const parsed = parseFractionStrings(ansN, effectiveD);
    if (!parsed) {
      setFeedback({ kind: 'error', message: 'Escriu una fracció vàlida (el denominador no pot ser 0).' });
      return;
    }

    if (!areEquivalent(parsed, challenge.finalAnswer)) {
      setMistakes((m) => m + 1);
      setFeedback({
        kind: 'error',
        message: `Compta les cel·les verdes d’encreuament (${
          selectedRows * selectedCols
        }) sobre el total (${challenge.rows * challenge.cols}).`,
      });
      return;
    }

    if (!isReduced(parsed)) {
      setFeedback({
        kind: 'info',
        message: 'Molt bé! Ara simplifica la fracció fins a obtenir la forma irreductible.',
      });
      return;
    }

    setFeedback(null);
    setSolved(true);
    onComplete(false, mistakes <= 1);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
        <p className="text-[15px] text-slate-800">{challenge.story}</p>
        <div className="flex items-center justify-center py-1">
          <ExprView
            tokens={[
              { kind: 'frac', value: challenge.targetA },
              { kind: 'op', value: '×' },
              { kind: 'frac', value: challenge.targetB },
            ]}
            size="lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-7 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span>Fes clic a una cel·la per marcar files × columnes</span>
            <span className="font-mono tabular-nums font-semibold text-slate-800">
              {selectedRows}/{challenge.rows} files × {selectedCols}/{challenge.cols} col.
            </span>
          </div>

          <div
            className="grid gap-1.5 max-w-[340px] mx-auto"
            style={{ gridTemplateColumns: `repeat(${challenge.cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: challenge.rows }).map((_, r) =>
              Array.from({ length: challenge.cols }).map((__, c) => {
                const inRow = r < selectedRows;
                const inCol = c < selectedCols;
                const both = inRow && inCol;

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    disabled={solved}
                    onClick={() => {
                      setSelectedRows(r + 1);
                      setSelectedCols(c + 1);
                      setFeedback(null);
                    }}
                    aria-label={`Fila ${r + 1}, Columna ${c + 1}`}
                    className={`aspect-square rounded-md border transition-colors ${
                      both
                        ? 'bg-emerald-600 border-emerald-700'
                        : inRow
                          ? 'bg-blue-100 border-blue-300'
                          : inCol
                            ? 'bg-amber-100 border-amber-300'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  />
                );
              })
            )}
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-600" />
              Encreuament: <strong className="font-mono">{selectedRows * selectedCols}</strong> de{' '}
              <strong className="font-mono">{challenge.rows * challenge.cols}</strong>
            </span>
          </div>
        </div>

        <div className="md:col-span-5 rounded-xl border border-slate-200 bg-white p-5 flex flex-col items-center justify-center gap-4">
          <p className="text-sm font-medium text-slate-800 text-center">
            Escriu la fracció irreductible resultant:
          </p>
          <FracInput
            nValue={ansN}
            dValue={ansD}
            onNChange={(v) => {
              setAnsN(v);
              setFeedback(null);
            }}
            onDChange={(v) => {
              setAnsD(v);
              setFeedback(null);
            }}
            disabled={solved}
            onSubmit={handleCheck}
            status={feedback?.kind === 'error' ? 'error' : solved ? 'correct' : 'idle'}
          />
          {!solved && (
            <button
              type="button"
              onClick={handleCheck}
              className="w-full px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors"
            >
              Comprova model i fracció
            </button>
          )}
        </div>
      </div>

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

      {solved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
            <div>
              <p className="text-base font-semibold text-emerald-950">
                Model d’àrea completat ({formatFracText(challenge.finalAnswer)})!
              </p>
              <p className="text-sm text-emerald-800">
                {selectedRows * selectedCols}/{challenge.rows * challenge.cols} cel·les encreuades simplifica a{' '}
                {formatFracText(challenge.finalAnswer)}.
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

// ---------------------------------------------------------------------------
// 3. INTERACTIVE STRIP BUILDER (+ / -)
// ---------------------------------------------------------------------------

const StripBuilderRunner: React.FC<{
  challenge: Extract<RepteVisualExercise['challenge'], { variant: 'strip_builder' }>;
  onComplete: (usedHint: boolean, solvedCleanly: boolean) => void;
  onNext: () => void;
}> = ({ challenge, onComplete, onNext }) => {
  const [activeSegments, setActiveSegments] = useState<boolean[]>(
    () => Array(challenge.denominator).fill(false)
  );
  const [ansN, setAnsN] = useState('');
  const [ansD, setAnsD] = useState('');
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'info'; message: string } | null>(null);
  const [solved, setSolved] = useState(false);

  const paintedCount = activeSegments.filter(Boolean).length;

  const handleToggle = (idx: number) => {
    if (solved) return;
    setActiveSegments((prev) => prev.map((v, i) => (i === idx ? !v : v)));
    setFeedback(null);
  };

  const handleCheck = () => {
    const paintedFrac = { n: paintedCount, d: challenge.denominator };
    if (!areEquivalent(paintedFrac, challenge.finalAnswer)) {
      setMistakes((m) => m + 1);
      setFeedback({
        kind: 'error',
        message: `Has pintat ${paintedCount}/${challenge.denominator}, però el resultat de l’operació no correspon a aquesta quantitat.`,
      });
      return;
    }

    const effectiveD =
      challenge.finalAnswer.d === 1 && ansD.trim() === '' ? '1' : ansD;
    if (ansN.trim() === '' || effectiveD.trim() === '') {
      setFeedback({ kind: 'error', message: 'Escriu el numerador i el denominador al requadre.' });
      return;
    }
    const parsed = parseFractionStrings(ansN, effectiveD);
    if (!parsed) {
      setFeedback({ kind: 'error', message: 'Escriu una fracció vàlida (el denominador no pot ser 0).' });
      return;
    }
    if (!areEquivalent(parsed, challenge.finalAnswer)) {
      setMistakes((m) => m + 1);
      setFeedback({
        kind: 'error',
        message: 'La barra està ben pintada, però revisa la fracció que has escrit!',
      });
      return;
    }
    if (!isReduced(parsed)) {
      setFeedback({
        kind: 'info',
        message: 'La fracció és equivalent, però simplifica-la fins a fer-la irreductible.',
      });
      return;
    }

    setFeedback(null);
    setSolved(true);
    onComplete(false, mistakes <= 1);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
        <p className="text-[15px] text-slate-800">{challenge.story}</p>
        <div className="flex items-center justify-center py-1">
          <ExprView
            tokens={[
              { kind: 'frac', value: challenge.left },
              { kind: 'op', value: challenge.op },
              { kind: 'frac', value: challenge.right },
            ]}
            size="lg"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span>Toca els segments per pintar la fracció resultant</span>
          <span className="font-mono font-semibold text-slate-900 tabular-nums">
            Pintat: {paintedCount}/{challenge.denominator}
          </span>
        </div>

        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${challenge.denominator}, minmax(0, 1fr))` }}
        >
          {activeSegments.map((on, idx) => (
            <button
              key={idx}
              type="button"
              disabled={solved}
              onClick={() => handleToggle(idx)}
              aria-label={`Segment ${idx + 1} de ${challenge.denominator}`}
              className={`h-14 rounded-md border transition-colors ${
                on
                  ? 'bg-blue-700 border-blue-800 text-white'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-400'
              }`}
            >
              <span className="font-mono text-xs tabular-nums">{idx + 1}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-800">
              Resultat en fracció irreductible:
            </span>
            <FracInput
              nValue={ansN}
              dValue={ansD}
              onNChange={(v) => {
                setAnsN(v);
                setFeedback(null);
              }}
              onDChange={(v) => {
                setAnsD(v);
                setFeedback(null);
              }}
              disabled={solved}
              onSubmit={handleCheck}
              status={feedback?.kind === 'error' ? 'error' : solved ? 'correct' : 'idle'}
            />
          </div>

          {!solved && (
            <button
              type="button"
              onClick={handleCheck}
              className="px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Comprova barra i fracció
            </button>
          )}
        </div>
      </div>

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

      {solved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
            <div>
              <p className="text-base font-semibold text-emerald-950">
                Barra fraccionària correcta ({formatFracText(challenge.finalAnswer)})!
              </p>
              <p className="text-sm text-emerald-800">
                {paintedCount}/{challenge.denominator} equival a {formatFracText(challenge.finalAnswer)}.
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
