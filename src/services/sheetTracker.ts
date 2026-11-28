import type { Difficulty, ExerciseType } from '../types/exercises';

const DEFAULT_EXEC_URL =
  'https://script.google.com/macros/s/AKfycbyTmk_zmkdZn7i2898FTD6Qx_rqjXtg_t3D7riKGtnLMUofrABr61uDqCz5hyiX8t7h/exec';

export const SHEET_WEBHOOK_URL =
  (import.meta.env.VITE_SHEET_WEBHOOK_URL as string | undefined) || DEFAULT_EXEC_URL;

export type CourseLevel = '1r ESO' | '2n ESO' | '3r ESO' | '4t ESO';
export type ClassGroup = 'A' | 'B' | 'C';

export interface StudentSession {
  name: string;
  course: CourseLevel;
  classGroup: ClassGroup;
}

const TYPE_LABELS_CA: Record<ExerciseType, string> = {
  pas_a_pas: 'Pas a pas',
  detecta_errada: 'Detecta l’errada',
  nombre_falta: 'Nombre que falta',
  repte_visual: 'Repte visual',
};

export async function recordStudentLogin(session: StudentSession): Promise<void> {
  await postToSheet({
    event: 'login',
    name: session.name,
    course: session.course,
    classGroup: session.classGroup,
    summary: 'Sessió iniciada',
  });
}

export async function recordExerciseCompletion(
  session: StudentSession,
  details: {
    exerciseType: ExerciseType;
    difficulty: Difficulty;
    summary: string;
    usedHint: boolean;
    solvedCleanly: boolean;
    currentStreak: number;
  }
): Promise<void> {
  await postToSheet({
    event: 'exercise',
    name: session.name,
    course: session.course,
    classGroup: session.classGroup,
    exerciseType: TYPE_LABELS_CA[details.exerciseType],
    difficulty: details.difficulty,
    summary: details.summary,
    usedHint: details.usedHint,
    solvedCleanly: details.solvedCleanly,
    currentStreak: details.currentStreak,
  });
}

async function postToSheet(payload: Record<string, unknown>): Promise<void> {
  try {
    // Use text/plain so browsers skip CORS OPTIONS preflight (unsupported by Apps Script)
    await fetch(SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Non-blocking: never interrupt student practice on transient network issues
  }
}
