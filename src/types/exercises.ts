import type { Fraction, Operator } from '../math/fractions';

export type Difficulty = 1 | 2 | 3;

export type ExerciseType =
  | 'pas_a_pas'
  | 'detecta_errada'
  | 'nombre_falta'
  | 'repte_visual';

export type PracticeMode = 'mixta' | ExerciseType;

export type ExprToken =
  | { kind: 'frac'; value: Fraction }
  | { kind: 'op'; value: Operator }
  | { kind: 'paren'; value: '(' | ')' }
  | { kind: 'missing'; id: string };

export interface StepChoice {
  kind: 'choice';
  id: string;
  prompt: string;
  hint: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
}

export interface StepSingleFrac {
  kind: 'single_frac';
  id: string;
  prompt: string;
  hint: string;
  prefixTokens?: ExprToken[];
  suffixTokens?: ExprToken[];
  expected: Fraction;
  requireReduced: boolean;
  /** If defined, numerator and denominator must match this exact unsimplified form (e.g., common denominator) */
  requireExactDenominator?: number;
}

export interface StepDualFrac {
  kind: 'dual_frac';
  id: string;
  prompt: string;
  hint: string;
  op: '+' | '-' | '×';
  expectedLeft: Fraction;
  expectedRight: Fraction;
  prefixTokens?: ExprToken[];
  suffixTokens?: ExprToken[];
  /** Lock denominators to common denominator if desired, or let student enter both */
  lockDenominators?: number;
  requireExactMatch?: boolean;
}

export type GuidedStep = StepChoice | StepSingleFrac | StepDualFrac;

export interface PasAPasExercise {
  type: 'pas_a_pas';
  id: string;
  difficulty: Difficulty;
  subtitle: string;
  conceptTip: string;
  expression: ExprToken[];
  steps: GuidedStep[];
  finalAnswer: Fraction;
  visualAid?: {
    kind: 'bars' | 'area';
    left: Fraction;
    right: Fraction;
    op: Operator;
  };
}

export interface WorkedStepLine {
  stepNumber: number;
  label: string;
  tokens: ExprToken[];
  isError: boolean;
}

export interface DetectaErradaExercise {
  type: 'detecta_errada';
  id: string;
  difficulty: Difficulty;
  subtitle: string;
  conceptTip: string;
  studentName: string;
  expression: ExprToken[];
  workedLines: WorkedStepLine[];
  errorLineIndex: number;
  reasonOptions: { id: string; text: string }[];
  correctReasonId: string;
  correctFinalAnswer: Fraction;
  explanationSummary: string;
}

export interface NombreFaltaExercise {
  type: 'nombre_falta';
  id: string;
  difficulty: Difficulty;
  subtitle: string;
  conceptTip: string;
  /** Equation display with one missing box inside one of the fractions */
  leftSide: (
    | { kind: 'frac'; n: number | null; d: number | null; highlightMissing?: 'n' | 'd' }
    | { kind: 'op'; value: Operator }
    | { kind: 'paren'; value: '(' | ')' }
  )[];
  rightResult: Fraction;
  missingTarget: 'n' | 'd';
  expectedValue: number;
  maxAllowedDenominator: number;
  stepHintText: string;
  visualData?: {
    knownFrac: Fraction;
    targetFrac: Fraction;
    op: '+' | '-' | '×' | '÷';
    missingFrac: Fraction;
  };
}

export type VisualChallengeVariant =
  | {
      variant: 'image_context';
      imageUrl: string;
      imageAlt: string;
      imageCaption: string;
      story: string;
      steps: GuidedStep[];
      finalAnswer: Fraction;
    }
  | {
      variant: 'area_grid_builder';
      rows: number;
      cols: number;
      targetA: Fraction; // horizontal
      targetB: Fraction; // vertical
      story: string;
      finalAnswer: Fraction;
    }
  | {
      variant: 'strip_builder';
      denominator: number; // <= 12
      left: Fraction;
      right: Fraction;
      op: '+' | '-';
      story: string;
      finalAnswer: Fraction;
    };

export interface RepteVisualExercise {
  type: 'repte_visual';
  id: string;
  difficulty: Difficulty;
  subtitle: string;
  conceptTip: string;
  challenge: VisualChallengeVariant;
}

export type Exercise =
  | PasAPasExercise
  | DetectaErradaExercise
  | NombreFaltaExercise
  | RepteVisualExercise;

export interface ExerciseRecord {
  id: string;
  timestamp: number;
  type: ExerciseType;
  difficulty: Difficulty;
  summary: string;
  solvedCleanly: boolean; // solved without revealing answer / excessive hints
  usedHint: boolean;
}

export interface ProgressStats {
  totalCompleted: number;
  cleanCount: number;
  currentStreak: number;
  bestStreak: number;
  byType: Record<ExerciseType, { completed: number; clean: number }>;
  byDifficulty: Record<Difficulty, { completed: number; clean: number }>;
  history: ExerciseRecord[];
}
