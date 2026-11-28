import React, { useEffect, useState } from 'react';
import { Check, Link2, LogOut, RefreshCw } from 'lucide-react';
import { EXERCISE_CYCLE, generateExercise } from './math/exerciseGenerator';
import type {
  Difficulty,
  Exercise,
  ExerciseType,
  PracticeMode,
  ProgressStats,
} from './types/exercises';
import { StepByStepExercise } from './components/StepByStepExercise';
import { ErrorDetectionExercise } from './components/ErrorDetectionExercise';
import { MissingNumberExercise } from './components/MissingNumberExercise';
import { VisualChallengeExercise } from './components/VisualChallengeExercise';
import { VisualLab } from './components/VisualLab';
import { ProgressView } from './components/ProgressView';
import { GuideView } from './components/GuideView';
import {
  AccessGate,
  clearStudentSession,
  loadStudentSession,
} from './components/AccessGate';
import {
  recordExerciseCompletion,
  recordStudentLogin,
  type StudentSession,
} from './services/sheetTracker';

type AppTab = 'practica' | 'laboratori' | 'progres' | 'guia';

const STORAGE_KEY_PREFIX = 'fracciolab_progress_v1_';

const EMPTY_STATS: ProgressStats = {
  totalCompleted: 0,
  cleanCount: 0,
  currentStreak: 0,
  bestStreak: 0,
  byType: {
    pas_a_pas: { completed: 0, clean: 0 },
    detecta_errada: { completed: 0, clean: 0 },
    nombre_falta: { completed: 0, clean: 0 },
    repte_visual: { completed: 0, clean: 0 },
  },
  byDifficulty: {
    1: { completed: 0, clean: 0 },
    2: { completed: 0, clean: 0 },
    3: { completed: 0, clean: 0 },
  },
  history: [],
};

function getStudentStorageKey(session: StudentSession | null): string | undefined {
  if (!session) return undefined;
  return `${session.course}_${session.classGroup}_${session.name.toLowerCase().replace(/\s+/g, '_')}`;
}

function loadStats(studentKey?: string): ProgressStats {
  if (!studentKey) return EMPTY_STATS;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${studentKey}`);
    if (!raw) return EMPTY_STATS;
    const parsed = JSON.parse(raw) as ProgressStats;
    if (typeof parsed.totalCompleted !== 'number') return EMPTY_STATS;
    return parsed;
  } catch {
    return EMPTY_STATS;
  }
}

const MODE_OPTIONS: { id: PracticeMode; label: string; desc: string }[] = [
  { id: 'mixta', label: 'Sessió mixta', desc: 'Alterna tots els tipus' },
  { id: 'pas_a_pas', label: 'Pas a pas', desc: 'Operacions combinades guiades' },
  { id: 'detecta_errada', label: 'Detecta l’errada', desc: 'Troba i corregeix el error' },
  { id: 'nombre_falta', label: 'Nombre que falta', desc: 'Completa la igualtat' },
  { id: 'repte_visual', label: 'Reptes visuals', desc: 'Imatges, àrees i barres' },
];

const DIFFICULTY_OPTIONS: { id: Difficulty; label: string; sub: string }[] = [
  { id: 1, label: 'Nivell 1', sub: 'Operacions bàsiques' },
  { id: 2, label: 'Nivell 2', sub: 'Combinades i parèntesis' },
  { id: 3, label: 'Nivell 3', sub: 'Signes i doble parèntesi' },
];

const TYPE_LABEL_MAP: Record<ExerciseType, string> = {
  pas_a_pas: 'Resolució pas a pas',
  detecta_errada: 'Detecta l’errada',
  nombre_falta: 'Nombre que falta',
  repte_visual: 'Repte visual',
};

const VALID_MODES: PracticeMode[] = [
  'mixta',
  'pas_a_pas',
  'detecta_errada',
  'nombre_falta',
  'repte_visual',
];

function getInitialParams(): { mode: PracticeMode; difficulty: Difficulty } {
  if (typeof window === 'undefined') return { mode: 'mixta', difficulty: 1 };
  const params = new URLSearchParams(window.location.search);
  const rawMode = params.get('tipus') as PracticeMode | null;
  const rawDiff = Number(params.get('nivell'));
  const mode: PracticeMode =
    rawMode && VALID_MODES.includes(rawMode) ? rawMode : 'mixta';
  const difficulty: Difficulty =
    rawDiff === 1 || rawDiff === 2 || rawDiff === 3 ? rawDiff : 1;
  return { mode, difficulty };
}

export default function App() {
  const initialParams = getInitialParams();
  const [activeTab, setActiveTab] = useState<AppTab>('practica');
  const [mode, setMode] = useState<PracticeMode>(initialParams.mode);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialParams.difficulty);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [visualCounter, setVisualCounter] = useState(0);
  const [exercise, setExercise] = useState<Exercise>(() => {
    const startType: ExerciseType =
      initialParams.mode === 'mixta' ? 'pas_a_pas' : initialParams.mode;
    return generateExercise(startType, initialParams.difficulty, 0);
  });
  const [completedCurrent, setCompletedCurrent] = useState(false);
  const [studentSession, setStudentSession] = useState<StudentSession | null>(() =>
    loadStudentSession()
  );
  const [stats, setStats] = useState<ProgressStats>(() =>
    loadStats(getStudentStorageKey(loadStudentSession()))
  );
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const key = getStudentStorageKey(studentSession);
    if (!key) return;
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(stats));
    } catch {
      // Ignore storage quota errors
    }
  }, [stats, studentSession]);

  const spawnExercise = (
    nextMode: PracticeMode,
    nextDiff: Difficulty,
    nextCycleIdx: number,
    nextVisualIdx: number
  ) => {
    const resolvedType: ExerciseType =
      nextMode === 'mixta'
        ? EXERCISE_CYCLE[nextCycleIdx % EXERCISE_CYCLE.length]
        : nextMode;

    setExercise(generateExercise(resolvedType, nextDiff, nextVisualIdx));
    setCompletedCurrent(false);
    if (resolvedType === 'repte_visual') {
      setVisualCounter(nextVisualIdx + 1);
    }
  };

  const syncUrlParams = (nextMode: PracticeMode, nextDiff: Difficulty) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tipus', nextMode);
      url.searchParams.set('nivell', String(nextDiff));
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore history errors in restricted frames
    }
  };

  const handleModeChange = (nextMode: PracticeMode) => {
    setMode(nextMode);
    setActiveTab('practica');
    syncUrlParams(nextMode, difficulty);
    spawnExercise(nextMode, difficulty, cycleIndex, visualCounter);
  };

  const handleDifficultyChange = (nextDiff: Difficulty) => {
    setDifficulty(nextDiff);
    setActiveTab('practica');
    syncUrlParams(mode, nextDiff);
    spawnExercise(mode, nextDiff, cycleIndex, visualCounter);
  };

  const handleCopyShareLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tipus', mode);
      url.searchParams.set('nivell', String(difficulty));
      await navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // Fallback ignored if clipboard unavailable
    }
  };

  const handleNextExercise = () => {
    const nextCycle = mode === 'mixta' ? cycleIndex + 1 : cycleIndex;
    setCycleIndex(nextCycle);
    setActiveTab('practica');
    spawnExercise(mode, difficulty, nextCycle, visualCounter);
  };

  const handleCompleteExercise = (usedHint: boolean, solvedCleanly: boolean) => {
    if (completedCurrent) return;
    setCompletedCurrent(true);

    const clean = solvedCleanly && !usedHint;
    const nextStreak = clean ? stats.currentStreak + 1 : 0;

    if (studentSession) {
      void recordExerciseCompletion(studentSession, {
        exerciseType: exercise.type,
        difficulty: exercise.difficulty,
        summary: exercise.subtitle,
        usedHint,
        solvedCleanly,
        currentStreak: nextStreak,
      });
    }

    setStats((prev) => {
      const updatedStreak = clean ? prev.currentStreak + 1 : 0;
      const nextBest = Math.max(prev.bestStreak, updatedStreak);
      const t = exercise.type;
      const d = exercise.difficulty;

      return {
        totalCompleted: prev.totalCompleted + 1,
        cleanCount: prev.cleanCount + (clean ? 1 : 0),
        currentStreak: updatedStreak,
        bestStreak: nextBest,
        byType: {
          ...prev.byType,
          [t]: {
            completed: prev.byType[t].completed + 1,
            clean: prev.byType[t].clean + (clean ? 1 : 0),
          },
        },
        byDifficulty: {
          ...prev.byDifficulty,
          [d]: {
            completed: prev.byDifficulty[d].completed + 1,
            clean: prev.byDifficulty[d].clean + (clean ? 1 : 0),
          },
        },
        history: [
          {
            id: exercise.id,
            timestamp: Date.now(),
            type: t,
            difficulty: d,
            summary: exercise.subtitle,
            solvedCleanly,
            usedHint,
          },
          ...prev.history,
        ].slice(0, 30),
      };
    });
  };

  const handleResetStats = () => {
    setStats(EMPTY_STATS);
  };

  const handleUnlock = (session: StudentSession) => {
    setStudentSession(session);
    setStats(loadStats(getStudentStorageKey(session)));
    void recordStudentLogin(session);
  };

  const handleLogout = () => {
    clearStudentSession();
    setStudentSession(null);
  };

  if (!studentSession) {
    return <AccessGate onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] text-slate-900">
      {/* Top Bar: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element brand wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('practica')}
            className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            FraccióLab
          </button>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            aria-label="Navegació principal"
            className="flex items-center gap-5 sm:gap-7 text-sm font-medium overflow-x-auto"
          >
            {(
              [
                { id: 'practica', label: 'Pràctica' },
                { id: 'laboratori', label: 'Laboratori' },
                { id: 'progres', label: 'Progrés' },
                { id: 'guia', label: 'Guia' },
              ] as const
            ).map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                    active
                      ? 'border-blue-700 text-slate-900 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleNextExercise}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Nou repte</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'practica' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left / Top Primary Interactive Stage */}
            <section className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
              {/* Quiet unboxed metadata line */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-blue-700">
                      {TYPE_LABEL_MAP[exercise.type]}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Nivell {exercise.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span>Denominadors ≤ 12</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                    {exercise.subtitle}
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={handleNextExercise}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
                >
                  Canvia d’exercici
                </button>
              </div>

              {/* Active Exercise Engine */}
              {exercise.type === 'pas_a_pas' && (
                <StepByStepExercise
                  key={exercise.id}
                  exercise={exercise}
                  onComplete={handleCompleteExercise}
                  onNext={handleNextExercise}
                />
              )}

              {exercise.type === 'detecta_errada' && (
                <ErrorDetectionExercise
                  key={exercise.id}
                  exercise={exercise}
                  onComplete={handleCompleteExercise}
                  onNext={handleNextExercise}
                />
              )}

              {exercise.type === 'nombre_falta' && (
                <MissingNumberExercise
                  key={exercise.id}
                  exercise={exercise}
                  onComplete={handleCompleteExercise}
                  onNext={handleNextExercise}
                />
              )}

              {exercise.type === 'repte_visual' && (
                <VisualChallengeExercise
                  key={exercise.id}
                  exercise={exercise}
                  onComplete={handleCompleteExercise}
                  onNext={handleNextExercise}
                />
              )}
            </section>

            {/* Right / Bottom Control & Concept Deck */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Mode Selector */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">Tipus d’exercici</h2>
                <div className="space-y-1.5">
                  {MODE_OPTIONS.map((opt) => {
                    const active = mode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleModeChange(opt.id)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-lg border transition-colors flex items-center justify-between gap-2 ${
                          active
                            ? 'border-blue-600 bg-blue-50/70 text-blue-950'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-semibold">{opt.label}</div>
                          <div className="text-xs text-slate-500">{opt.desc}</div>
                        </div>
                        {active && (
                          <span className="text-xs font-mono font-semibold text-blue-700">
                            Actiu
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Selector */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">Nivell de dificultat</h2>
                <div className="grid grid-cols-1 gap-2">
                  {DIFFICULTY_OPTIONS.map((opt) => {
                    const active = difficulty === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleDifficultyChange(opt.id)}
                        className={`text-left px-3.5 py-2.5 rounded-lg border transition-colors ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-sm font-semibold">{opt.label}</div>
                        <div
                          className={`text-xs ${
                            active ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {opt.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contextual Concept Note */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
                <h2 className="text-sm font-semibold text-slate-900">Idea clau</h2>
                <p className="text-sm leading-relaxed text-slate-600">
                  {exercise.conceptTip}
                </p>
              </div>

              {/* Compact Session Tally */}
              <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 flex items-center justify-between text-sm">
                <div>
                  <div className="text-xs text-slate-500">Completats</div>
                  <div className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
                    {stats.totalCompleted}
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <div className="text-xs text-slate-500">Ratxa directa</div>
                  <div className="font-mono text-lg font-semibold text-blue-700 tabular-nums">
                    {stats.currentStreak}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('progres')}
                  className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap"
                >
                  Veure detall
                </button>
              </div>

              {/* Student Identity & Sign Out */}
              <div className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {studentSession.name}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {studentSession.course} · Classe {studentSession.classGroup}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Surt</span>
                </button>
              </div>

              {/* Share preset link for classroom */}
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span className="text-emerald-800">Enllaç copiat amb aquest nivell i tipus</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 text-slate-500" />
                    <span>Copia l’enllaç d’aquesta pràctica per a la classe</span>
                  </>
                )}
              </button>
            </aside>
          </div>
        )}

        {activeTab === 'laboratori' && <VisualLab />}
        {activeTab === 'progres' && (
          <ProgressView
            stats={stats}
            studentName={studentSession.name}
            studentCourse={studentSession.course}
            studentClassGroup={studentSession.classGroup}
            onReset={handleResetStats}
          />
        )}
        {activeTab === 'guia' && <GuideView />}
      </main>

      <footer className="border-t border-slate-200 bg-white py-5">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>FraccióLab · Repàs d’operacions amb fraccions per a secundària (ESO)</span>
          <span>Denominadors fins a 12 · Resolució guiada i reptes productius</span>
        </div>
      </footer>
    </div>
  );
}
