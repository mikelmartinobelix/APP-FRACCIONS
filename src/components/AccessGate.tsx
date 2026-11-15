import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';

const EXPECTED_DIGEST = '63f8c07e:13512942';
export const ACCESS_STORAGE_KEY = 'fracciolab_access_v1';

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

export function isAccessUnlocked(): boolean {
  try {
    return sessionStorage.getItem(ACCESS_STORAGE_KEY) === EXPECTED_DIGEST;
  } catch {
    return false;
  }
}

interface AccessGateProps {
  onUnlock: () => void;
}

export const AccessGate: React.FC<AccessGateProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = password.trim();
    if (!trimmed) {
      setError('Introdueix la contrasenya de la classe.');
      return;
    }

    const digest = computeAccessDigest(trimmed);
    if (digest === EXPECTED_DIGEST) {
      try {
        sessionStorage.setItem(ACCESS_STORAGE_KEY, digest);
      } catch {
        // Ignore sessionStorage restrictions
      }
      setError(null);
      onUnlock();
    } else {
      setError('Contrasenya incorrecta. Comprova les majúscules i minúscules.');
    }
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
            Accés per a l’alumnat
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Introdueix la contrasenya facilitada pel professorat per accedir als exercicis de fraccions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="classroom-password"
              className="block text-xs font-semibold text-slate-700"
            >
              Contrasenya de classe
            </label>
            <div className="relative">
              <input
                id="classroom-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                autoFocus
                autoComplete="current-password"
                placeholder="Escriu la contrasenya"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                className={`w-full h-11 pl-3.5 pr-11 rounded-lg border text-sm font-medium outline-none transition-colors ${
                  error
                    ? 'border-red-500 bg-red-50/40 text-red-950 focus:ring-2 focus:ring-red-500/20'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20'
                }`}
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
