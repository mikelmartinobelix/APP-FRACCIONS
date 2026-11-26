export interface Fraction {
  n: number;
  d: number;
}

export type Operator = '+' | '-' | '×' | '÷';

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x === 0 ? 1 : x;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

export function lcmMany(nums: number[]): number {
  return nums.reduce((acc, v) => lcm(acc, v), 1);
}

export function normalize(f: Fraction): Fraction {
  if (f.d === 0) throw new Error('Denominador zero no vàlid');
  if (f.n === 0) return { n: 0, d: 1 };
  const sign = f.d < 0 ? -1 : 1;
  return { n: f.n * sign, d: Math.abs(f.d) };
}

export function simplify(f: Fraction): Fraction {
  const norm = normalize(f);
  if (norm.n === 0) return { n: 0, d: 1 };
  const g = gcd(norm.n, norm.d);
  return { n: norm.n / g, d: norm.d / g };
}

export function add(a: Fraction, b: Fraction): Fraction {
  return simplify({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
}

export function sub(a: Fraction, b: Fraction): Fraction {
  return simplify({ n: a.n * b.d - b.n * a.d, d: a.d * b.d });
}

export function mul(a: Fraction, b: Fraction): Fraction {
  return simplify({ n: a.n * b.n, d: a.d * b.d });
}

export function div(a: Fraction, b: Fraction): Fraction {
  if (b.n === 0) throw new Error('Divisió per zero');
  return simplify({ n: a.n * b.d, d: a.d * b.n });
}

export function applyOp(a: Fraction, op: Operator, b: Fraction): Fraction {
  switch (op) {
    case '+':
      return add(a, b);
    case '-':
      return sub(a, b);
    case '×':
      return mul(a, b);
    case '÷':
      return div(a, b);
  }
}

export function areEquivalent(a: Fraction, b: Fraction): boolean {
  if (a.d === 0 || b.d === 0) return false;
  return a.n * b.d === b.n * a.d;
}

export function isReduced(f: Fraction): boolean {
  if (f.d <= 0) return false;
  if (f.n === 0) return f.d === 1;
  return gcd(f.n, f.d) === 1;
}

export function isExactMatch(a: Fraction, b: Fraction): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return na.n === nb.n && na.d === nb.d;
}

export function scaleToDenominator(f: Fraction, targetD: number): Fraction {
  const factor = targetD / f.d;
  return { n: f.n * factor, d: targetD };
}

export function parseFractionStrings(nStr: string, dStr: string): Fraction | null {
  const nTrim = nStr.replace(/\u2212/g, '-').trim();
  const dTrim = dStr.replace(/\u2212/g, '-').trim();
  if (!/^-?\d+$/.test(nTrim) || !/^-?\d+$/.test(dTrim)) return null;
  const n = Number(nTrim);
  const d = Number(dTrim);
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || d === 0) return null;
  return normalize({ n, d });
}

export function formatFracText(f: Fraction): string {
  const n = normalize(f);
  if (n.d === 1) return `${n.n}`;
  return `${n.n}/${n.d}`;
}

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
