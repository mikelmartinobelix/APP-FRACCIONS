import React from 'react';
import type { Fraction } from '../math/fractions';
import type { ExprToken } from '../types/exercises';

interface FracViewProps {
  fraction: Fraction;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  highlight?: 'none' | 'accent' | 'success' | 'error';
}

export const FracView: React.FC<FracViewProps> = ({
  fraction,
  size = 'md',
  highlight = 'none',
}) => {
  const isNeg = fraction.n < 0;
  const absN = Math.abs(fraction.n);

  const sizeClasses = {
    sm: { num: 'text-sm leading-tight px-1', bar: 'h-[1.5px] my-0.5', sign: 'text-sm mr-0.5' },
    md: { num: 'text-lg leading-tight px-1.5', bar: 'h-[2px] my-0.5', sign: 'text-lg mr-1' },
    lg: { num: 'text-2xl leading-tight px-2', bar: 'h-[2px] my-1', sign: 'text-2xl mr-1' },
    xl: { num: 'text-3xl leading-tight px-2.5', bar: 'h-[2.5px] my-1', sign: 'text-3xl mr-1.5' },
  }[size];

  const colorClasses = {
    none: { text: 'text-slate-900', bar: 'bg-slate-800' },
    accent: { text: 'text-blue-700', bar: 'bg-blue-700' },
    success: { text: 'text-emerald-700', bar: 'bg-emerald-700' },
    error: { text: 'text-red-700', bar: 'bg-red-700' },
  }[highlight];

  if (fraction.d === 1) {
    return (
      <span className={`inline-flex items-center font-mono font-semibold tabular-nums ${sizeClasses.num} ${colorClasses.text}`}>
        {isNeg ? `−${absN}` : absN}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center align-middle font-mono font-semibold tabular-nums ${colorClasses.text}`}>
      {isNeg && <span className={sizeClasses.sign}>−</span>}
      <span className="inline-flex flex-col items-center justify-center">
        <span className={sizeClasses.num}>{absN}</span>
        <span className={`w-full min-w-[1.2em] rounded-full ${sizeClasses.bar} ${colorClasses.bar}`} />
        <span className={sizeClasses.num}>{fraction.d}</span>
      </span>
    </span>
  );
};

interface ExprViewProps {
  tokens: ExprToken[];
  size?: 'sm' | 'md' | 'lg' | 'xl';
  highlight?: 'none' | 'accent' | 'success' | 'error';
}

export const ExprView: React.FC<ExprViewProps> = ({
  tokens,
  size = 'lg',
  highlight = 'none',
}) => {
  const opSize = {
    sm: 'text-base mx-1',
    md: 'text-xl mx-1.5',
    lg: 'text-2xl mx-2',
    xl: 'text-3xl mx-2.5',
  }[size];

  const parenSize = {
    sm: 'text-xl mx-0.5',
    md: 'text-3xl mx-0.5',
    lg: 'text-4xl mx-1',
    xl: 'text-5xl mx-1',
  }[size];

  return (
    <div className="inline-flex flex-wrap items-center justify-center gap-y-2">
      {tokens.map((tok, idx) => {
        if (tok.kind === 'frac') {
          return <FracView key={idx} fraction={tok.value} size={size} highlight={highlight} />;
        }
        if (tok.kind === 'op') {
          const symbol = tok.value === '-' ? '−' : tok.value;
          return (
            <span
              key={idx}
              className={`font-mono font-medium text-slate-500 select-none ${opSize}`}
            >
              {symbol}
            </span>
          );
        }
        if (tok.kind === 'paren') {
          return (
            <span
              key={idx}
              className={`font-sans font-light text-slate-400 select-none leading-none ${parenSize}`}
            >
              {tok.value}
            </span>
          );
        }
        return (
          <span
            key={idx}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border-2 border-dashed border-blue-500 bg-blue-50/70 font-mono text-blue-700 font-semibold mx-1"
          >
            ?
          </span>
        );
      })}
    </div>
  );
};

interface FracInputProps {
  nValue: string;
  dValue: string;
  onNChange: (val: string) => void;
  onDChange: (val: string) => void;
  lockedDenominator?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  onSubmit?: () => void;
  status?: 'idle' | 'correct' | 'error';
  labelPrefix?: string;
}

export const FracInput: React.FC<FracInputProps> = ({
  nValue,
  dValue,
  onNChange,
  onDChange,
  lockedDenominator,
  disabled = false,
  autoFocus = false,
  onSubmit,
  status = 'idle',
  labelPrefix,
}) => {
  const effectiveD = lockedDenominator !== undefined ? String(lockedDenominator) : dValue;

  const borderStyle =
    status === 'correct'
      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
      : status === 'error'
        ? 'border-red-500 bg-red-50/50 text-red-900'
        : 'border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="inline-flex flex-col items-center">
      {labelPrefix && (
        <span className="text-xs font-medium text-slate-500 mb-1">{labelPrefix}</span>
      )}
      <div className="inline-flex flex-col items-center w-20">
        <input
          type="text"
          inputMode="text"
          aria-label="Numerador"
          placeholder="?"
          value={nValue}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={(e) => {
            const v = e.target.value.replace(/\u2212/g, '-').replace(/[^0-9-]/g, '');
            onNChange(v);
          }}
          onKeyDown={handleKeyDown}
          className={`w-16 h-11 text-center font-mono text-xl font-semibold tabular-nums rounded-lg border transition-colors outline-none ${borderStyle} disabled:opacity-75`}
        />
        <div className="w-full h-[2.5px] bg-slate-800 my-1.5 rounded-full" />
        {lockedDenominator !== undefined ? (
          <div
            aria-label={`Denominador fixat a ${lockedDenominator}`}
            className="w-16 h-11 flex items-center justify-center font-mono text-xl font-semibold tabular-nums rounded-lg bg-slate-100 border border-slate-200 text-slate-700"
          >
            {effectiveD}
          </div>
        ) : (
          <input
            type="text"
            inputMode="numeric"
            aria-label="Denominador"
            placeholder="?"
            value={dValue}
            disabled={disabled}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, '');
              onDChange(v);
            }}
            onKeyDown={handleKeyDown}
            className={`w-16 h-11 text-center font-mono text-xl font-semibold tabular-nums rounded-lg border transition-colors outline-none ${borderStyle} disabled:opacity-75`}
          />
        )}
      </div>
    </div>
  );
};
