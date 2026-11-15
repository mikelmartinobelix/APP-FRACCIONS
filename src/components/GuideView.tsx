import React from 'react';
import { FracView } from './MathDisplay';

export const GuideView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
          Guia ràpida d’operacions amb fraccions
        </h1>
        <p className="mt-2 text-slate-600">
          Resum essencial per entendre per què funciona cada procediment i evitar les errades més freqüents a l’ESO.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            01. Suma i resta: sempre mateix denominador
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            No podem sumar porcions de mides diferents directament. Cal trobar el mínim comú múltiple (m.c.m.) dels denominadors, obtenir fraccions equivalents i operar només els numeradors.
          </p>
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 flex items-center justify-center gap-2 font-mono text-sm">
            <FracView fraction={{ n: 1, d: 3 }} size="sm" />
            <span>+</span>
            <FracView fraction={{ n: 1, d: 4 }} size="sm" />
            <span>=</span>
            <FracView fraction={{ n: 4, d: 12 }} size="sm" highlight="accent" />
            <span>+</span>
            <FracView fraction={{ n: 3, d: 12 }} size="sm" highlight="accent" />
            <span>=</span>
            <FracView fraction={{ n: 7, d: 12 }} size="sm" highlight="success" />
          </div>
          <p className="text-xs text-red-700 font-medium">
            Error habitual: sumar 3 + 4 al denominador. Mai no es sumen els denominadors!
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            02. Multiplicació: numerador multiplica, denominador divideix
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            En una fracció, el <strong>numerador té rol de multiplicador</strong> i el <strong>denominador té rol de divisor</strong>. En multiplicar dues fraccions, ajuntem els multiplicadors a dalt i els divisors a sota (en línia recta).
          </p>
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 flex items-center justify-center gap-2 font-mono text-sm">
            <FracView fraction={{ n: 2, d: 3 }} size="sm" />
            <span>×</span>
            <FracView fraction={{ n: 3, d: 5 }} size="sm" />
            <span>=</span>
            <FracView fraction={{ n: 6, d: 15 }} size="sm" highlight="accent" />
            <span>=</span>
            <FracView fraction={{ n: 2, d: 5 }} size="sm" highlight="success" />
          </div>
          <p className="text-xs text-slate-500">
            2 i 3 multipliquen a dalt; 3 i 5 divideixen a sota. Pots simplificar abans o després.
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            03. Divisió: s’inverteixen els rols del divisor
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            En dividir per una fracció, els seus termes agafen el <strong>rol contrari</strong>: el numerador passa a <strong>dividir</strong> (va a sota) i el denominador passa a <strong>multiplicar</strong> (va a dalt). Per això multipliquem per la fracció inversa!
          </p>
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 flex items-center justify-center gap-2 font-mono text-sm">
            <FracView fraction={{ n: 3, d: 4 }} size="sm" />
            <span>÷</span>
            <FracView fraction={{ n: 2, d: 5 }} size="sm" />
            <span>=</span>
            <FracView fraction={{ n: 3, d: 4 }} size="sm" />
            <span>×</span>
            <FracView fraction={{ n: 5, d: 2 }} size="sm" highlight="accent" />
            <span>=</span>
            <FracView fraction={{ n: 15, d: 8 }} size="sm" highlight="success" />
          </div>
          <p className="text-xs text-red-700 font-medium">
            Error habitual: invertir els rols de la primera fracció en comptes de la segona.
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            04. Jerarquia d’operacions combinades
          </h2>
          <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
            <li>
              <strong className="text-slate-900">Parèntesis:</strong> es resolen sempre primer.
            </li>
            <li>
              <strong className="text-slate-900">Multiplicacions i divisions:</strong> d’esquerra a dreta.
            </li>
            <li>
              <strong className="text-slate-900">Sumes i restes:</strong> al final, reduint a comú denominador.
            </li>
            <li>
              <strong className="text-slate-900">Simplificació final:</strong> divideix dalt i baix pel M.C.D. fins a la fracció irreductible.
            </li>
          </ol>
        </article>
      </div>
    </div>
  );
};
