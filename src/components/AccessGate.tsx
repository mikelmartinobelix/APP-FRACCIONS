import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Lock, User } from 'lucide-react';
import type {
  ClassGroup,
  CourseLevel,
  StudentSession,
} from '../services/sheetTracker';

const EXPECTED_DIGEST = '63f8c07e:13512942';
export const SESSION_STORAGE_KEY = 'fracciolab_student_v3';

export const COURSE_OPTIONS: CourseLevel[] = [
  '1r ESO',
  '2n ESO',
  '3r ESO',
  '4t ESO',
];

export const CLASS_OPTIONS: ClassGroup[] = ['A', 'B', 'C'];

export function computeAccessDigest(s: string): string {
  let h1 = 2166136261 >>> 0;
  let h2 = 5381 >>> 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = (Math.imul(h2, 33) ^ c) >>> 0;
  }
  return `${h1.toString(16)}:${h2.toString(16)}`;
}

interface StoredSession extends StudentSession {
  accessDigest?: string;
}

export function loadStudentSession(): StudentSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (
      typeof parsed.name !== 'string' ||
      !parsed.course ||
      !COURSE_OPTIONS.includes(parsed.course) ||
      !parsed.classGroup ||
      !CLASS_OPTIONS.includes(parsed.classGroup) ||
      parsed.accessDigest !== EXPECTED_DIGEST
    ) {
      return null;
    }
    const cleanName = parsed.name.trim();
    if (cleanName.length < 2) return null;
    return {
      name: cleanName,
      course: parsed.course,
      classGroup: parsed.classGroup,
    };
  } catch {
    return null;
  }
}

export function clearStudentSession(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage restrictions
  }
}

interface AccessGateProps {
  onUnlock: (session: StudentSession) => void;
}

export const AccessGate: React.FC<AccessGateProps> = ({ onUnlock }) => {
  const [name, setName] = useState('');
  const [course, setCourse] = useState<CourseLevel | null>(null);
  const [classGroup, setClassGroup] = useState<ClassGroup | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPass = password.trim();

    if (cleanName.length < 2) {
      setError('Escriu el teu nom i cognoms per identificar la teva feina.');
      return;
    }

    if (!course) {
      setError('Selecciona el teu curs (1r, 2n, 3r o 4t ESO).');
      return;
    }

    if (!classGroup) {
      setError('Selecciona la teva classe (A, B o C).');
      return;
    }

    if (!cleanPass || computeAccessDigest(cleanPass) !== EXPECTED_DIGEST) {
      setError('Contrasenya de classe incorrecta. Comprova les majúscules i minúscules.');
      return;
    }

    const session: StudentSession = {
      name: cleanName,
      course,
      classGroup,
    };

    try {
      const stored: StoredSession = {
        ...session,
        accessDigest: EXPECTED_DIGEST,
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Ignore sessionStorage restrictions
    }

    setError(null);
    onUnlock(session);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F8FA] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 sm:p-8 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 text-slate-900">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-700 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">FraccióLab</span>
          </div>

          <h1 className="text-2xl font-semibold text-slate-900 pt-2">
            Identificació de l’alumnat
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Introdueix el teu nom i cognoms, el curs, la classe i la contrasenya per començar a practicar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="student-name"
              className="block text-xs font-semibold text-slate-700"
            >
              Nom i cognoms
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="student-name"
                type="text"
                value={name}
                autoFocus
                autoComplete="name"
                placeholder="Ex. Laia Puig"
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-700">Curs</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="group" aria-label="Curs">
              {COURSE_OPTIONS.map((opt) => {
                const active = course === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setCourse(opt);
                      if (error) setError(null);
                    }}
                    className={`h-11 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-700">Classe</span>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Classe">
              {CLASS_OPTIONS.map((grp) => {
                const active = classGroup === grp;
                return (
                  <button
                    key={grp}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setClassGroup(grp);
                      if (error) setError(null);
                    }}
                    className={`h-11 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {grp}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="classroom-password"
              className="block text-xs font-semibold text-slate-700"
            >
              Contrasenya
            </label>
            <div className="relative">
              <input
                id="classroom-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                autoComplete="current-password"
                placeholder="Escriu la contrasenya"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full h-11 pl-3.5 pr-11 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Amaga la contrasenya' : 'Mostra la contrasenya'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-medium text-red-900"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full h-11 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            Entra a practicar
          </button>
        </form>
      </div>
    </div>
  );
};
