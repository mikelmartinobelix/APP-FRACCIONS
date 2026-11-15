import {
  add,
  applyOp,
  areEquivalent,
  div,
  formatFracText,
  gcd,
  lcm,
  mul,
  pickRandom,
  randInt,
  scaleToDenominator,
  simplify,
  sub,
  type Fraction,
  type Operator,
} from './fractions';
import type {
  DetectaErradaExercise,
  Difficulty,
  Exercise,
  ExerciseType,
  GuidedStep,
  NombreFaltaExercise,
  PasAPasExercise,
  RepteVisualExercise,
} from '../types/exercises';
import mosaicTilesImg from '../assets/images/catalan_mosaic_tiles_1794730951368.jpg';
import bakeryCocaImg from '../assets/images/bakery_coca_slices_1794730950504.jpg';
import mountainTrailImg from '../assets/images/mountain_trail_map_1794730952788.jpg';

const L1_DENOMS = [2, 3, 4, 5, 6, 8, 10, 12] as const;
const ALL_DENOMS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const FRIENDLY_COMBOS: [number, number][] = [
  [2, 3],
  [2, 4],
  [2, 5],
  [2, 6],
  [3, 4],
  [3, 5],
  [3, 6],
  [3, 8],
  [3, 9],
  [3, 12],
  [4, 6],
  [4, 8],
  [4, 10],
  [4, 12],
  [5, 6],
  [5, 10],
  [6, 8],
  [6, 9],
  [6, 10],
  [6, 12],
  [8, 12],
  [9, 12],
];

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function makeProperFrac(d: number, minN = 1, maxN?: number): Fraction {
  const upper = Math.min(maxN ?? d - 1, d - 1);
  let n = randInt(minN, Math.max(minN, upper));
  // Avoid reducible trivial cases occasionally while keeping variety
  if (gcd(n, d) !== 1 && d > 3) {
    const candidates: number[] = [];
    for (let i = minN; i <= upper; i++) {
      if (gcd(i, d) === 1) candidates.push(i);
    }
    if (candidates.length > 0) n = pickRandom(candidates);
  }
  return { n, d };
}

function pickDifferentDenoms(difficulty: Difficulty): [number, number] {
  if (difficulty === 1) {
    const pair = pickRandom(FRIENDLY_COMBOS.filter(([a, b]) => lcm(a, b) <= 24));
    return Math.random() < 0.5 ? [pair[0], pair[1]] : [pair[1], pair[0]];
  }
  if (difficulty === 2) {
    const pair = pickRandom(FRIENDLY_COMBOS);
    return Math.random() < 0.5 ? [pair[0], pair[1]] : [pair[1], pair[0]];
  }
  // Level 3: allow any denominators <= 12 with different values and lcm <= 60
  for (let tries = 0; tries < 30; tries++) {
    const a = pickRandom(ALL_DENOMS);
    const b = pickRandom(ALL_DENOMS);
    if (a !== b && lcm(a, b) <= 60) return [a, b];
  }
  return [7, 12];
}

// ---------------------------------------------------------------------------
// 1. PAS A PAS GENERATOR
// ---------------------------------------------------------------------------

function generatePasAPas(difficulty: Difficulty): PasAPasExercise {
  if (difficulty === 1) {
    return generatePasAPasLevel1();
  }
  if (difficulty === 2) {
    return generatePasAPasLevel2();
  }
  return generatePasAPasLevel3();
}

function generatePasAPasLevel1(): PasAPasExercise {
  const op = pickRandom<Operator>(['+', '-', '×', '÷']);
  const [d1, d2] = pickDifferentDenoms(1);
  let f1 = makeProperFrac(d1);
  let f2 = makeProperFrac(d2);

  if (op === '-' && f1.n * f2.d < f2.n * f1.d) {
    [f1, f2] = [f2, f1];
  }

  const finalAnswer = applyOp(f1, op, f2);
  const steps: GuidedStep[] = [];

  if (op === '+' || op === '-') {
    const commonD = lcm(f1.d, f2.d);
    const sf1 = scaleToDenominator(f1, commonD);
    const sf2 = scaleToDenominator(f2, commonD);
    const unreduced: Fraction = {
      n: op === '+' ? sf1.n + sf2.n : sf1.n - sf2.n,
      d: commonD,
    };

    steps.push({
      kind: 'choice',
      id: 'mcm',
      prompt: `Quin és el mínim comú múltiple (m.c.m.) dels denominadors ${f1.d} i ${f2.d}?`,
      hint: `Busca el nombre més petit diferent de zero que sigui múltiple de ${f1.d} i de ${f2.d} alhora.`,
      options: buildNumberOptions(commonD, [f1.d + f2.d, f1.d * f2.d === commonD ? commonD * 2 : f1.d * f2.d, Math.max(f1.d, f2.d)]),
      correctOptionId: String(commonD),
    });

    steps.push({
      kind: 'dual_frac',
      id: 'equivalents',
      prompt: `Transforma cada fracció a denominador ${commonD}:`,
      hint: `Divideix ${commonD} entre cada denominador antic i multiplica el resultat pel numerador corresponent.`,
      op,
      expectedLeft: sf1,
      expectedRight: sf2,
      lockDenominators: commonD,
      requireExactMatch: true,
    });

    const needsSimplify = gcd(unreduced.n, unreduced.d) > 1 && unreduced.n !== 0;

    if (needsSimplify) {
      steps.push({
        kind: 'single_frac',
        id: 'raw_sum',
        prompt: `${op === '+' ? 'Suma' : 'Resta'} els numeradors mantenint el denominador ${commonD}:`,
        hint: `Calcula ${sf1.n} ${op} ${sf2.n} al numerador i conserva el ${commonD} a sota.`,
        expected: unreduced,
        requireReduced: false,
        requireExactDenominator: commonD,
      });

      steps.push({
        kind: 'single_frac',
        id: 'simplify',
        prompt: `Simplifica ${formatFracText(unreduced)} fins obtenir la fracció irreductible:`,
        hint: `Divideix numerador i denominador pel seu màxim comú divisor (${gcd(unreduced.n, unreduced.d)}).`,
        expected: finalAnswer,
        requireReduced: true,
      });
    } else {
      steps.push({
        kind: 'single_frac',
        id: 'final',
        prompt: `${op === '+' ? 'Suma' : 'Resta'} els numeradors i comprova que ja és irreductible:`,
        hint: `Calcula ${sf1.n} ${op} ${sf2.n} al numerador.`,
        expected: finalAnswer,
        requireReduced: true,
      });
    }

    return {
      type: 'pas_a_pas',
      id: makeId('pap'),
      difficulty: 1,
      subtitle: `${op === '+' ? 'Suma' : 'Resta'} amb diferent denominador`,
      conceptTip:
        'Per sumar o restar fraccions, cal tenir el mateix denominador. Reduïm al m.c.m. i després operem només els numeradors.',
      expression: [
        { kind: 'frac', value: f1 },
        { kind: 'op', value: op },
        { kind: 'frac', value: f2 },
      ],
      steps,
      finalAnswer,
      visualAid: { kind: 'bars', left: f1, right: f2, op },
    };
  }

  if (op === '×') {
    const raw: Fraction = { n: f1.n * f2.n, d: f1.d * f2.d };
    const g = gcd(raw.n, raw.d);

    steps.push({
      kind: 'single_frac',
      id: 'multiply_line',
      prompt: 'Multiplica en línia (numerador × numerador i denominador × denominador):',
      hint: `Calcula ${f1.n} × ${f2.n} a dalt i ${f1.d} × ${f2.d} a sota.`,
      expected: raw,
      requireReduced: false,
      requireExactDenominator: raw.d,
    });

    if (g > 1) {
      steps.push({
        kind: 'single_frac',
        id: 'simplify_prod',
        prompt: `Simplifica ${formatFracText(raw)} fins a la fracció irreductible:`,
        hint: `Tant ${raw.n} com ${raw.d} es poden dividir entre ${g}.`,
        expected: finalAnswer,
        requireReduced: true,
      });
    }

    return {
      type: 'pas_a_pas',
      id: makeId('pap'),
      difficulty: 1,
      subtitle: 'Multiplicació de fraccions',
      conceptTip:
        'La multiplicació de fraccions es fa en línia: no cal buscar comú denominador. Recorda simplificar el resultat!',
      expression: [
        { kind: 'frac', value: f1 },
        { kind: 'op', value: '×' },
        { kind: 'frac', value: f2 },
      ],
      steps,
      finalAnswer,
      visualAid: { kind: 'area', left: f1, right: f2, op: '×' },
    };
  }

  // Division
  const invertedSecond: Fraction = { n: f2.d, d: f2.n };
  const raw: Fraction = { n: f1.n * f2.d, d: f1.d * f2.n };
  const g = gcd(raw.n, raw.d);

  steps.push({
    kind: 'dual_frac',
    id: 'invert_second',
    prompt: 'Transforma la divisió en una multiplicació invertint la segona fracció:',
    hint: `La primera fracció (${formatFracText(f1)}) es queda igual, i ${formatFracText(f2)} passa a ser ${formatFracText(invertedSecond)}.`,
    op: '×',
    expectedLeft: f1,
    expectedRight: invertedSecond,
    requireExactMatch: true,
  });

  if (g > 1) {
    steps.push({
      kind: 'single_frac',
      id: 'raw_div',
      prompt: 'Calcula el producte resultant abans de simplificar:',
      hint: `Multiplica ${f1.n} × ${f2.d} al numerador i ${f1.d} × ${f2.n} al denominador.`,
      expected: raw,
      requireReduced: false,
      requireExactDenominator: raw.d,
    });
    steps.push({
      kind: 'single_frac',
      id: 'simplify_div',
      prompt: 'Simplifica fins a obtenir la fracció irreductible:',
      hint: `Divideix numerador i denominador entre ${g}.`,
      expected: finalAnswer,
      requireReduced: true,
    });
  } else {
    steps.push({
      kind: 'single_frac',
      id: 'final_div',
      prompt: 'Calcula el producte final irreductible:',
      hint: `Multiplica ${f1.n} × ${f2.d} i ${f1.d} × ${f2.n}.`,
      expected: finalAnswer,
      requireReduced: true,
    });
  }

  return {
    type: 'pas_a_pas',
    id: makeId('pap'),
    difficulty: 1,
    subtitle: 'Divisió de fraccions',
    conceptTip:
      'Dividir per una fracció equival a multiplicar per la seva inversa (capgirant numerador i denominador de la segona fracció).',
    expression: [
      { kind: 'frac', value: f1 },
      { kind: 'op', value: '÷' },
      { kind: 'frac', value: f2 },
    ],
    steps,
    finalAnswer,
  };
}

function generatePasAPasLevel2(): PasAPasExercise {
  const useParens = Math.random() < 0.5;

  if (!useParens) {
    // Pattern: a (+|-) b (×|÷) c
    const addOp = pickRandom<'+' | '-'>(['+', '-']);
    const mulOp = pickRandom<'×' | '÷'>(['×', '÷']);

    // Build clean fractions with d <= 12 where result is positive
    for (let attempt = 0; attempt < 40; attempt++) {
      const a = makeProperFrac(pickRandom([2, 3, 4, 5, 6, 8, 10, 12]));
      const b = makeProperFrac(pickRandom([2, 3, 4, 5, 6, 8, 9, 10, 12]));
      const c = makeProperFrac(pickRandom([2, 3, 4, 5, 6, 8, 9, 10, 12]));
      const bc = applyOp(b, mulOp, c);
      if (bc.d > 24) continue;
      const total = applyOp(a, addOp, bc);
      if (total.n <= 0 || total.d > 36) continue;

      const commonD = lcm(a.d, bc.d);
      if (commonD > 36) continue;

      const steps: GuidedStep[] = [
        {
          kind: 'choice',
          id: 'priority',
          prompt: 'Segons la jerarquia d’operacions, què hem de resoldre primer?',
          hint: 'Sense parèntesis, les multiplicacions i divisions sempre van abans que les sumes i restes.',
          options: [
            {
              id: 'first_pair',
              label: `Operar ${formatFracText(a)} ${addOp} ${formatFracText(b)}`,
            },
            {
              id: 'second_pair',
              label: `Operar ${formatFracText(b)} ${mulOp} ${formatFracText(c)}`,
            },
          ],
          correctOptionId: 'second_pair',
        },
        {
          kind: 'single_frac',
          id: 'step_mul_div',
          prompt: `Resol la ${mulOp === '×' ? 'multiplicació' : 'divisió'} prioritària (simplificada si es pot):`,
          hint:
            mulOp === '×'
              ? `Multiplica en línia: (${b.n}×${c.n}) / (${b.d}×${c.d}) i simplifica.`
              : `Multiplica ${formatFracText(b)} per la inversa de ${formatFracText(c)} (${c.d}/${c.n}) i simplifica.`,
          prefixTokens: [
            { kind: 'frac', value: a },
            { kind: 'op', value: addOp },
          ],
          expected: bc,
          requireReduced: true,
        },
        {
          kind: 'dual_frac',
          id: 'step_common_d',
          prompt: `Ara redueix a comú denominador (m.c.m. = ${commonD}) per completar l’operació:`,
          hint: `Converteix ${formatFracText(a)} i ${formatFracText(bc)} a denominador ${commonD}.`,
          op: addOp,
          expectedLeft: scaleToDenominator(a, commonD),
          expectedRight: scaleToDenominator(bc, commonD),
          lockDenominators: commonD,
          requireExactMatch: true,
        },
        {
          kind: 'single_frac',
          id: 'step_final',
          prompt: 'Calcula el resultat final en forma de fracció irreductible:',
          hint: `Opera els numeradors sobre ${commonD} i simplifica fins que no es pugui dividir més.`,
          expected: total,
          requireReduced: true,
        },
      ];

      return {
        type: 'pas_a_pas',
        id: makeId('pap'),
        difficulty: 2,
        subtitle: 'Operació combinada sense parèntesis',
        conceptTip:
          'Jerarquia d’operacions: primer les multiplicacions i divisions (d’esquerra a dreta), i finalment les sumes i restes amb comú denominador.',
        expression: [
          { kind: 'frac', value: a },
          { kind: 'op', value: addOp },
          { kind: 'frac', value: b },
          { kind: 'op', value: mulOp },
          { kind: 'frac', value: c },
        ],
        steps,
        finalAnswer: total,
      };
    }
  }

  // Pattern with parentheses: (a ± b) ×/÷ c
  for (let attempt = 0; attempt < 40; attempt++) {
    const addOp = pickRandom<'+' | '-'>(['+', '-']);
    const mulOp = pickRandom<'×' | '÷'>(['×', '÷']);
    const [d1, d2] = pickDifferentDenoms(2);
    let a = makeProperFrac(d1);
    let b = makeProperFrac(d2);
    if (addOp === '-' && a.n * b.d <= b.n * a.d) [a, b] = [b, a];
    const parenRes = applyOp(a, addOp, b);
    if (parenRes.n <= 0 || parenRes.d > 24) continue;
    const c = makeProperFrac(pickRandom([2, 3, 4, 5, 6, 8, 9, 10, 12]));
    const total = applyOp(parenRes, mulOp, c);
    if (total.d > 36) continue;

    const commonD = lcm(a.d, b.d);

    const steps: GuidedStep[] = [
      {
        kind: 'dual_frac',
        id: 'paren_common',
        prompt: `Primer resolem el parèntesi. Passa les dues fraccions a denominador ${commonD}:`,
        hint: `El m.c.m. de ${a.d} i ${b.d} és ${commonD}.`,
        op: addOp,
        expectedLeft: scaleToDenominator(a, commonD),
        expectedRight: scaleToDenominator(b, commonD),
        lockDenominators: commonD,
        requireExactMatch: true,
      },
      {
        kind: 'single_frac',
        id: 'paren_res',
        prompt: 'Escriu el resultat simplificat del parèntesi:',
        hint: `Calcula la ${addOp === '+' ? 'suma' : 'resta'} i simplifica si és possible.`,
        suffixTokens: [
          { kind: 'op', value: mulOp },
          { kind: 'frac', value: c },
        ],
        expected: parenRes,
        requireReduced: true,
      },
      {
        kind: 'single_frac',
        id: 'final_op',
        prompt: `Finalment, resol la ${mulOp === '×' ? 'multiplicació' : 'divisió'} i simplifica:`,
        hint:
          mulOp === '×'
            ? `Multiplica en línia ${formatFracText(parenRes)} × ${formatFracText(c)}.`
            : `Multiplica ${formatFracText(parenRes)} per la inversa de ${formatFracText(c)}.`,
        expected: total,
        requireReduced: true,
      },
    ];

    return {
      type: 'pas_a_pas',
      id: makeId('pap'),
      difficulty: 2,
      subtitle: 'Operació combinada amb parèntesis',
      conceptTip:
        'Els parèntesis tenen la màxima prioritat: calcula primer l’operació interior amb comú denominador i després aplica l’operació exterior.',
      expression: [
        { kind: 'paren', value: '(' },
        { kind: 'frac', value: a },
        { kind: 'op', value: addOp },
        { kind: 'frac', value: b },
        { kind: 'paren', value: ')' },
        { kind: 'op', value: mulOp },
        { kind: 'frac', value: c },
      ],
      steps,
      finalAnswer: total,
    };
  }

  return generatePasAPasLevel1();
}

function generatePasAPasLevel3(): PasAPasExercise {
  // 4-fraction combined: (a ± b) ×/÷ (c ± d) or a - b × c + d (may yield negative intermediate or final!)
  const variant = Math.random() < 0.55 ? 'double_paren' : 'chain';

  if (variant === 'double_paren') {
    for (let attempt = 0; attempt < 60; attempt++) {
      const [d1, d2] = pickDifferentDenoms(2);
      const [d3, d4] = pickDifferentDenoms(2);
      const op1 = pickRandom<'+' | '-'>(['+', '-']);
      const op2 = pickRandom<'+' | '-'>(['+', '-']);
      const midOp = pickRandom<'×' | '÷'>(['×', '÷']);

      const a = makeProperFrac(d1);
      const b = makeProperFrac(d2);
      const c = makeProperFrac(d3);
      const d = makeProperFrac(d4);

      const leftVal = applyOp(a, op1, b);
      const rightVal = applyOp(c, op2, d);
      if (rightVal.n === 0 || leftVal.n === 0) continue;
      if (leftVal.d > 18 || rightVal.d > 18) continue;

      const total = applyOp(leftVal, midOp, rightVal);
      if (total.d > 48) continue;

      const steps: GuidedStep[] = [
        {
          kind: 'single_frac',
          id: 'left_paren',
          prompt: `Pas 1: Resol el primer parèntesi (${formatFracText(a)} ${op1} ${formatFracText(b)}) en forma irreductible:`,
          hint: `Fes el m.c.m. de ${a.d} i ${b.d} (que és ${lcm(a.d, b.d)}), opera i simplifica.`,
          suffixTokens: [
            { kind: 'op', value: midOp },
            { kind: 'paren', value: '(' },
            { kind: 'frac', value: c },
            { kind: 'op', value: op2 },
            { kind: 'frac', value: d },
            { kind: 'paren', value: ')' },
          ],
          expected: leftVal,
          requireReduced: true,
        },
        {
          kind: 'single_frac',
          id: 'right_paren',
          prompt: `Pas 2: Resol el segon parèntesi (${formatFracText(c)} ${op2} ${formatFracText(d)}) en forma irreductible:`,
          hint: `Fes el m.c.m. de ${c.d} i ${d.d} (que és ${lcm(c.d, d.d)}). Vigila el signe si el resultat és negatiu!`,
          prefixTokens: [
            { kind: 'frac', value: leftVal },
            { kind: 'op', value: midOp },
          ],
          expected: rightVal,
          requireReduced: true,
        },
        {
          kind: 'single_frac',
          id: 'final_merge',
          prompt: `Pas 3: Calcula ${formatFracText(leftVal)} ${midOp} ${formatFracText(rightVal)} i simplifica:`,
          hint:
            midOp === '×'
              ? 'Multiplica en línia tenint en compte la regla dels signes.'
              : 'Multiplica la primera fracció per la inversa de la segona i simplifica.',
          expected: total,
          requireReduced: true,
        },
      ];

      return {
        type: 'pas_a_pas',
        id: makeId('pap'),
        difficulty: 3,
        subtitle: 'Doble parèntesi i signes (3r–4t ESO)',
        conceptTip:
          'Resol cada parèntesi per separat fins a simplificar-lo. Després aplica la multiplicació o divisió aplicant la regla dels signes (+ · − = −, − · − = +).',
        expression: [
          { kind: 'paren', value: '(' },
          { kind: 'frac', value: a },
          { kind: 'op', value: op1 },
          { kind: 'frac', value: b },
          { kind: 'paren', value: ')' },
          { kind: 'op', value: midOp },
          { kind: 'paren', value: '(' },
          { kind: 'frac', value: c },
          { kind: 'op', value: op2 },
          { kind: 'frac', value: d },
          { kind: 'paren', value: ')' },
        ],
        steps,
        finalAnswer: total,
      };
    }
  }

  // Chain: a - b × c + d (or a + b ÷ c - d)
  for (let attempt = 0; attempt < 60; attempt++) {
    const a = makeProperFrac(pickRandom(ALL_DENOMS));
    const b = makeProperFrac(pickRandom(ALL_DENOMS));
    const c = makeProperFrac(pickRandom(ALL_DENOMS));
    const d = makeProperFrac(pickRandom(ALL_DENOMS));
    const midOp = pickRandom<'×' | '÷'>(['×', '÷']);
    const opLeft = pickRandom<'+' | '-'>(['-', '+']);
    const opRight = pickRandom<'+' | '-'>(['+', '-']);

    const midVal = applyOp(b, midOp, c);
    if (midVal.d > 24) continue;
    const firstTwo = applyOp(a, opLeft, midVal);
    if (firstTwo.d > 36) continue;
    const total = applyOp(firstTwo, opRight, d);
    if (total.d > 48) continue;

    const steps: GuidedStep[] = [
      {
        kind: 'single_frac',
        id: 'priority_mid',
        prompt: `Pas 1: Resol primer l’operació prioritària (${formatFracText(b)} ${midOp} ${formatFracText(c)}):`,
        hint: `Ignora de moment la suma/resta i calcula només ${formatFracText(b)} ${midOp} ${formatFracText(c)} simplificat.`,
        prefixTokens: [
          { kind: 'frac', value: a },
          { kind: 'op', value: opLeft },
        ],
        suffixTokens: [
          { kind: 'op', value: opRight },
          { kind: 'frac', value: d },
        ],
        expected: midVal,
        requireReduced: true,
      },
      {
        kind: 'single_frac',
        id: 'left_to_right',
        prompt: `Pas 2: Opera d’esquerra a dreta els dos primers termes (${formatFracText(a)} ${opLeft} ${formatFracText(midVal)}):`,
        hint: `Busca el m.c.m. de ${a.d} i ${midVal.d} (${lcm(a.d, midVal.d)}). Vigila el signe!`,
        suffixTokens: [
          { kind: 'op', value: opRight },
          { kind: 'frac', value: d },
        ],
        expected: firstTwo,
        requireReduced: true,
      },
      {
        kind: 'single_frac',
        id: 'final_step',
        prompt: `Pas 3: Completa l’última operació (${formatFracText(firstTwo)} ${opRight} ${formatFracText(d)}) en forma irreductible:`,
        hint: `Redueix a comú denominador ${lcm(firstTwo.d, d.d)} i simplifica el resultat final.`,
        expected: total,
        requireReduced: true,
      },
    ];

    return {
      type: 'pas_a_pas',
      id: makeId('pap'),
      difficulty: 3,
      subtitle: 'Cadena d’operacions combinades',
      conceptTip:
        'Quan tenim sumes, restes, multiplicacions i divisions barrejades, primer fem multiplicacions/divisions i després sumes/restes d’esquerra a dreta.',
      expression: [
        { kind: 'frac', value: a },
        { kind: 'op', value: opLeft },
        { kind: 'frac', value: b },
        { kind: 'op', value: midOp },
        { kind: 'frac', value: c },
        { kind: 'op', value: opRight },
        { kind: 'frac', value: d },
      ],
      steps,
      finalAnswer: total,
    };
  }

  return generatePasAPasLevel2();
}

function buildNumberOptions(correct: number, distractors: number[]): { id: string; label: string }[] {
  const set = new Set<number>([correct]);
  for (const d of distractors) {
    if (d > 0 && d !== correct) set.add(d);
  }
  while (set.size < 4) {
    set.add(correct + randInt(1, 8));
  }
  return Array.from(set)
    .slice(0, 4)
    .sort((a, b) => a - b)
    .map((n) => ({ id: String(n), label: String(n) }));
}

// ---------------------------------------------------------------------------
// 2. DETECTA L'ERRADA GENERATOR
// ---------------------------------------------------------------------------

const STUDENT_NAMES = ['Laia', 'Oriol', 'Núria', 'Pau', 'Abril', 'Biel', 'Clàudia', 'Marc'];

function generateDetectaErrada(difficulty: Difficulty): DetectaErradaExercise {
  const studentName = pickRandom(STUDENT_NAMES);

  if (difficulty === 1) {
    const mode = pickRandom(['add_denoms', 'forgot_scale_num', 'invert_first_div']);
    if (mode === 'add_denoms') {
      const [d1, d2] = pickDifferentDenoms(1);
      const a = makeProperFrac(d1);
      const b = makeProperFrac(d2);
      const correct = add(a, b);
      const wrong: Fraction = { n: a.n + b.n, d: a.d + b.d };

      return {
        type: 'detecta_errada',
        id: makeId('err'),
        difficulty: 1,
        subtitle: 'Suma de fraccions',
        conceptTip: 'Mai no es sumen els denominadors entre si! El denominador indica la mida de les parts i cal igualar-lo primer.',
        studentName,
        expression: [
          { kind: 'frac', value: a },
          { kind: 'op', value: '+' },
          { kind: 'frac', value: b },
        ],
        workedLines: [
          {
            stepNumber: 1,
            label: 'Plantejament inicial',
            tokens: [
              { kind: 'frac', value: a },
              { kind: 'op', value: '+' },
              { kind: 'frac', value: b },
            ],
            isError: false,
          },
          {
            stepNumber: 2,
            label: 'Càlcul aplicat',
            tokens: [{ kind: 'frac', value: wrong }],
            isError: true,
          },
        ],
        errorLineIndex: 1,
        reasonOptions: [
          {
            id: 'added_denoms',
            text: 'Ha sumat els numeradors i també els denominadors directament sense buscar comú denominador.',
          },
          {
            id: 'multiplied_cross',
            text: 'Ha multiplicat en creu com si fos una divisió.',
          },
          {
            id: 'wrong_simplify',
            text: 'No ha simplificat la fracció final correctament.',
          },
        ],
        correctReasonId: 'added_denoms',
        correctFinalAnswer: correct,
        explanationSummary: `Cal reduir al m.c.m. (${lcm(a.d, b.d)}), transformar els numeradors i obtenir ${formatFracText(correct)}.`,
      };
    }

    if (mode === 'forgot_scale_num') {
      const [d1, d2] = pickDifferentDenoms(1);
      const a = makeProperFrac(d1);
      const b = makeProperFrac(d2);
      const commonD = lcm(a.d, b.d);
      const correct = add(a, b);
      const wrongSum: Fraction = { n: a.n + b.n, d: commonD };

      return {
        type: 'detecta_errada',
        id: makeId('err'),
        difficulty: 1,
        subtitle: 'Canvi a comú denominador',
        conceptTip: 'Si multipliques el denominador per un nombre per arribar al m.c.m., també has de multiplicar el numerador pel mateix nombre.',
        studentName,
        expression: [
          { kind: 'frac', value: a },
          { kind: 'op', value: '+' },
          { kind: 'frac', value: b },
        ],
        workedLines: [
          {
            stepNumber: 1,
            label: `Busca el m.c.m. (${commonD})`,
            tokens: [
              { kind: 'frac', value: { n: a.n, d: commonD } },
              { kind: 'op', value: '+' },
              { kind: 'frac', value: { n: b.n, d: commonD } },
            ],
            isError: true,
          },
          {
            stepNumber: 2,
            label: 'Suma els numeradors',
            tokens: [{ kind: 'frac', value: simplify(wrongSum) }],
            isError: false,
          },
        ],
        errorLineIndex: 0,
        reasonOptions: [
          {
            id: 'forgot_num',
            text: 'Ha canviat els denominadors al m.c.m., però s’ha oblidat d’escalar els numeradors.',
          },
          {
            id: 'wrong_mcm',
            text: `El m.c.m. de ${a.d} i ${b.d} no és ${commonD}.`,
          },
          {
            id: 'sign_err',
            text: 'Havia de restar en lloc de sumar.',
          },
        ],
        correctReasonId: 'forgot_num',
        correctFinalAnswer: correct,
        explanationSummary: `En passar a denominador ${commonD}, ${formatFracText(a)} = ${formatFracText(scaleToDenominator(a, commonD))} i ${formatFracText(b)} = ${formatFracText(scaleToDenominator(b, commonD))}. El resultat correcte és ${formatFracText(correct)}.`,
      };
    }

    // invert_first_div
    const [d1, d2] = pickDifferentDenoms(1);
    const a = makeProperFrac(d1);
    const b = makeProperFrac(d2);
    const correct = div(a, b);
    const invertedFirst: Fraction = { n: a.d, d: a.n };
    const wrongResult = mul(invertedFirst, b);

    return {
      type: 'detecta_errada',
      id: makeId('err'),
      difficulty: 1,
      subtitle: 'Divisió de fraccions',
      conceptTip: 'En dividir dues fraccions, només s’inverteix la segona fracció (el divisor), mai la primera!',
      studentName,
      expression: [
        { kind: 'frac', value: a },
        { kind: 'op', value: '÷' },
        { kind: 'frac', value: b },
      ],
      workedLines: [
        {
          stepNumber: 1,
          label: 'Passa la divisió a multiplicació',
          tokens: [
            { kind: 'frac', value: invertedFirst },
            { kind: 'op', value: '×' },
            { kind: 'frac', value: b },
          ],
          isError: true,
        },
        {
          stepNumber: 2,
          label: 'Multiplica i simplifica',
          tokens: [{ kind: 'frac', value: wrongResult }],
          isError: false,
        },
      ],
      errorLineIndex: 0,
      reasonOptions: [
        {
          id: 'inverted_first',
          text: 'Ha invertit la primera fracció en comptes d’invertir la segona (el divisor).',
        },
        {
          id: 'forgot_op_change',
          text: 'No es pot convertir una divisió en multiplicació.',
        },
        {
          id: 'added_instead',
          text: 'Havia de buscar comú denominador abans de dividir.',
        },
      ],
      correctReasonId: 'inverted_first',
      correctFinalAnswer: correct,
      explanationSummary: `Cal mantenir ${formatFracText(a)} i invertir ${formatFracText(b)} a ${b.d}/${b.n}: el resultat correcte és ${formatFracText(correct)}.`,
    };
  }

  if (difficulty === 2) {
    // Hierarchy mistake: a + b × c => (a + b) × c
    for (let attempt = 0; attempt < 30; attempt++) {
      const a = makeProperFrac(pickRandom([2, 3, 4, 5, 6, 8, 10]));
      const b = makeProperFrac(pickRandom([2, 3, 4, 5, 6, 8]));
      const c = makeProperFrac(pickRandom([2, 3, 4, 5, 6, 8, 9]));
      const addOp = pickRandom<'+' | '-'>(['+', '-']);
      if (addOp === '-' && a.n * b.d <= b.n * a.d) continue;

      const wrongSum = applyOp(a, addOp, b);
      const wrongFinal = mul(wrongSum, c);
      const correct = applyOp(a, addOp, mul(b, c));
      if (areEquivalent(wrongFinal, correct)) continue;

      return {
        type: 'detecta_errada',
        id: makeId('err'),
        difficulty: 2,
        subtitle: 'Jerarquia en operacions combinades',
        conceptTip: 'Sense parèntesis, la multiplicació i la divisió sempre tenen prioritat sobre la suma i la resta.',
        studentName,
        expression: [
          { kind: 'frac', value: a },
          { kind: 'op', value: addOp },
          { kind: 'frac', value: b },
          { kind: 'op', value: '×' },
          { kind: 'frac', value: c },
        ],
        workedLines: [
          {
            stepNumber: 1,
            label: 'Comença operant d’esquerra a dreta',
            tokens: [
              { kind: 'frac', value: wrongSum },
              { kind: 'op', value: '×' },
              { kind: 'frac', value: c },
            ],
            isError: true,
          },
          {
            stepNumber: 2,
            label: 'Multiplica el resultat obtingut',
            tokens: [{ kind: 'frac', value: wrongFinal }],
            isError: false,
          },
        ],
        errorLineIndex: 0,
        reasonOptions: [
          {
            id: 'broke_hierarchy',
            text: `Ha fet primer la ${addOp === '+' ? 'suma' : 'resta'} en lloc de respectar la prioritat de la multiplicació.`,
          },
          {
            id: 'wrong_common_d',
            text: 'Ha calculat malament el comú denominador del primer pas.',
          },
          {
            id: 'forgot_invert',
            text: 'S’ha oblidat d’invertir l’última fracció.',
          },
        ],
        correctReasonId: 'broke_hierarchy',
        correctFinalAnswer: correct,
        explanationSummary: `Primer cal fer ${formatFracText(b)} × ${formatFracText(c)} = ${formatFracText(mul(b, c))}, i després operar amb ${formatFracText(a)} per obtenir ${formatFracText(correct)}.`,
      };
    }
  }

  // Level 3: Sign error with minus before parentheses: a - (b - c) => a - b - c (forgot sign flip!)
  for (let attempt = 0; attempt < 40; attempt++) {
    const a = makeProperFrac(pickRandom(ALL_DENOMS));
    const b = makeProperFrac(pickRandom(ALL_DENOMS));
    const c = makeProperFrac(pickRandom(ALL_DENOMS));
    if (b.n * c.d <= c.n * b.d) continue; // make b > c so difference is clean

    const correctParen = sub(b, c);
    const correct = sub(a, correctParen);

    // Mistake: expanded minus parenthesis without changing - c to + c
    const wrongMid = sub(a, b);
    const wrongFinal = sub(wrongMid, c);
    if (areEquivalent(wrongFinal, correct)) continue;

    return {
      type: 'detecta_errada',
      id: makeId('err'),
      difficulty: 3,
      subtitle: 'Signe negatiu davant d’un parèntesi',
      conceptTip: 'Un signe menys davant d’un parèntesi canvia el signe de tots els termes interiors: -(b - c) = -b + c.',
      studentName,
      expression: [
        { kind: 'frac', value: a },
        { kind: 'op', value: '-' },
        { kind: 'paren', value: '(' },
        { kind: 'frac', value: b },
        { kind: 'op', value: '-' },
        { kind: 'frac', value: c },
        { kind: 'paren', value: ')' },
      ],
      workedLines: [
        {
          stepNumber: 1,
          label: 'Treu el parèntesi',
          tokens: [
            { kind: 'frac', value: a },
            { kind: 'op', value: '-' },
            { kind: 'frac', value: b },
            { kind: 'op', value: '-' },
            { kind: 'frac', value: c },
          ],
          isError: true,
        },
        {
          stepNumber: 2,
          label: 'Opera d’esquerra a dreta',
          tokens: [{ kind: 'frac', value: wrongFinal }],
          isError: false,
        },
      ],
      errorLineIndex: 0,
      reasonOptions: [
        {
          id: 'sign_distrib',
          text: 'En treure el parèntesi precedit d’un menys, no ha canviat el signe del segon terme (havia de ser +).',
        },
        {
          id: 'should_multiply',
          text: 'Un parèntesi sempre indica una multiplicació entre fraccions.',
        },
        {
          id: 'wrong_reduce',
          text: 'Ha simplificat malament la fracció final.',
        },
      ],
      correctReasonId: 'sign_distrib',
      correctFinalAnswer: correct,
      explanationSummary: `Dins el parèntesi, ${formatFracText(b)} − ${formatFracText(c)} = ${formatFracText(correctParen)}. Després ${formatFracText(a)} − ${formatFracText(correctParen)} = ${formatFracText(correct)}.`,
    };
  }

  return generateDetectaErrada(1);
}

// ---------------------------------------------------------------------------
// 3. TROBA EL NOMBRE QUE FALTA GENERATOR
// ---------------------------------------------------------------------------

function generateNombreFalta(difficulty: Difficulty): NombreFaltaExercise {
  if (difficulty === 1) {
    const op = pickRandom<Operator>(['+', '-', '×', '÷']);
    const [d1, d2] = pickDifferentDenoms(1);
    let f1 = makeProperFrac(d1);
    let f2 = makeProperFrac(d2);
    if (op === '-' && f1.n * f2.d <= f2.n * f1.d) [f1, f2] = [f2, f1];

    const result = applyOp(f1, op, f2);
    const hideN = Math.random() < 0.7 || op === '+' || op === '-';

    if (hideN) {
      return {
        type: 'nombre_falta',
        id: makeId('mis'),
        difficulty: 1,
        subtitle: 'Troba el numerador ocult',
        conceptTip:
          op === '+' || op === '-'
            ? 'Escriu totes les fraccions amb el mateix denominador per veure immediatament quin numerador falta.'
            : 'Recorda l’operació inversa: per trobar un factor que falta, pots desfer l’operació des del resultat.',
        leftSide: [
          { kind: 'frac', n: null, d: f1.d, highlightMissing: 'n' },
          { kind: 'op', value: op },
          { kind: 'frac', n: f2.n, d: f2.d },
        ],
        rightResult: result,
        missingTarget: 'n',
        expectedValue: f1.n,
        maxAllowedDenominator: 12,
        stepHintText: `Aïlla la primera fracció fent l’operació inversa: ${formatFracText(result)} ${op === '+' ? '−' : op === '-' ? '+' : op === '×' ? '÷' : '×'} ${formatFracText(f2)} = ${formatFracText(f1)}.`,
        visualData: {
          knownFrac: f2,
          targetFrac: result,
          op,
          missingFrac: f1,
        },
      };
    }

    // Missing denominator in × or ÷
    return {
      type: 'nombre_falta',
      id: makeId('mis'),
      difficulty: 1,
      subtitle: 'Troba el denominador ocult',
      conceptTip: 'Desfés la multiplicació o divisió comparant la fracció resultant amb el numerador conegut.',
      leftSide: [
        { kind: 'frac', n: f1.n, d: f1.d },
        { kind: 'op', value: op },
        { kind: 'frac', n: f2.n, d: null, highlightMissing: 'd' },
      ],
      rightResult: result,
      missingTarget: 'd',
      expectedValue: f2.d,
      maxAllowedDenominator: 12,
      stepHintText: `Si la segona fracció té numerador ${f2.n}, el valor de la fracció completa ha de ser equivalent a ${formatFracText(f2)}.`,
      visualData: {
        knownFrac: f1,
        targetFrac: result,
        op,
        missingFrac: f2,
      },
    };
  }

  if (difficulty === 2) {
    // Pattern: ( □/d1 + f2 ) × f3 = total
    for (let attempt = 0; attempt < 40; attempt++) {
      const [d1, d2] = pickDifferentDenoms(2);
      const f1 = makeProperFrac(d1);
      const f2 = makeProperFrac(d2);
      const f3 = makeProperFrac(pickRandom(L1_DENOMS));
      const op1 = pickRandom<'+' | '-'>(['+', '-']);
      if (op1 === '-' && f1.n * f2.d <= f2.n * f1.d) continue;
      const paren = applyOp(f1, op1, f2);
      const total = mul(paren, f3);
      if (total.d > 36) continue;

      return {
        type: 'nombre_falta',
        id: makeId('mis'),
        difficulty: 2,
        subtitle: 'Raonament invers amb parèntesis',
        conceptTip:
          'Treballa de fora cap endins: primer desfés la multiplicació exterior dividint el resultat entre la fracció de fora.',
        leftSide: [
          { kind: 'paren', value: '(' },
          { kind: 'frac', n: null, d: f1.d, highlightMissing: 'n' },
          { kind: 'op', value: op1 },
          { kind: 'frac', n: f2.n, d: f2.d },
          { kind: 'paren', value: ')' },
          { kind: 'op', value: '×' },
          { kind: 'frac', n: f3.n, d: f3.d },
        ],
        rightResult: total,
        missingTarget: 'n',
        expectedValue: f1.n,
        maxAllowedDenominator: 12,
        stepHintText: `1) Divideix ${formatFracText(total)} ÷ ${formatFracText(f3)} = ${formatFracText(paren)}. 2) Desfés el parèntesi per trobar ${formatFracText(f1)}.`,
        visualData: {
          knownFrac: f2,
          targetFrac: paren,
          op: op1,
          missingFrac: f1,
        },
      };
    }
  }

  // Level 3: a - (b_n / □) × c = total (missing denominator inside combined operation)
  for (let attempt = 0; attempt < 50; attempt++) {
    const d1 = pickRandom(ALL_DENOMS);
    const d2 = pickRandom(ALL_DENOMS);
    const d3 = pickRandom(ALL_DENOMS);
    const a = makeProperFrac(d1);
    const b = makeProperFrac(d2);
    const c = makeProperFrac(d3);
    const bc = mul(b, c);
    const total = sub(a, bc);
    if (total.n <= 0 || total.d > 36) continue;

    return {
      type: 'nombre_falta',
      id: makeId('mis'),
      difficulty: 3,
      subtitle: 'Denominador ocult en operació combinada',
      conceptTip:
        'Aïlla primer el bloc de la multiplicació restant-lo de la primera fracció. Després troba quin denominador fa quadrar el producte.',
      leftSide: [
        { kind: 'frac', n: a.n, d: a.d },
        { kind: 'op', value: '-' },
        { kind: 'frac', n: b.n, d: null, highlightMissing: 'd' },
        { kind: 'op', value: '×' },
        { kind: 'frac', n: c.n, d: c.d },
      ],
      rightResult: total,
      missingTarget: 'd',
      expectedValue: b.d,
      maxAllowedDenominator: 12,
      stepHintText: `El bloc (${b.n}/□) × ${formatFracText(c)} ha de valer ${formatFracText(a)} − ${formatFracText(total)} = ${formatFracText(bc)}. Per tant, ${b.n}/□ = ${formatFracText(b)}.`,
      visualData: {
        knownFrac: bc,
        targetFrac: a,
        op: '-',
        missingFrac: total,
      },
    };
  }

  return generateNombreFalta(1);
}

// ---------------------------------------------------------------------------
// 4. REPTES VISUALS GENERATOR (Images + Interactive SVG Builders)
// ---------------------------------------------------------------------------

function generateRepteVisual(difficulty: Difficulty, indexHint?: number): RepteVisualExercise {
  const pool = ['mosaic_image', 'tart_image', 'trail_image', 'area_builder', 'strip_builder'] as const;
  const choice = indexHint !== undefined ? pool[indexHint % pool.length] : pickRandom(pool);

  if (choice === 'mosaic_image') {
    if (difficulty === 1) {
      return {
        type: 'repte_visual',
        id: makeId('vis'),
        difficulty: 1,
        subtitle: 'Rajoles hidràuliques de Barcelona',
        conceptTip: 'Compta el total de rajoles (denominador) i expressa cada color com a fracció irreductible.',
        challenge: {
          variant: 'image_context',
          imageUrl: mosaicTilesImg,
          imageAlt: 'Mosaic de 12 rajoles hidràuliques en una graella de 4 per 3 amb dissenys blaus, terracota i blancs',
          imageCaption: 'Graella de 4 × 3 rajoles hidràuliques (12 unitats en total)',
          story:
            'Observa aquest mosaic de 12 rajoles. Hi ha 3 rajoles de color terracota intens i 5 rajoles amb motiu blau fort (la resta tenen fons blanc). Quina fracció del mosaic ocupen conjuntament les rajoles terracota i les blaves?',
          steps: [
            {
              kind: 'dual_frac',
              id: 'tile_parts',
              prompt: 'Escriu la fracció de rajoles terracota i la de rajoles blaves sobre el total (12):',
              hint: 'Compta 3 de 12 per al terracota i 5 de 12 per al blau.',
              op: '+',
              expectedLeft: { n: 3, d: 12 },
              expectedRight: { n: 5, d: 12 },
              lockDenominators: 12,
              requireExactMatch: true,
            },
            {
              kind: 'single_frac',
              id: 'tile_sum',
              prompt: 'Calcula la suma i simplifica-la fins a la fracció irreductible:',
              hint: '3/12 + 5/12 = 8/12. Divideix numerador i denominador entre 4.',
              expected: { n: 2, d: 3 },
              requireReduced: true,
            },
          ],
          finalAnswer: { n: 2, d: 3 },
        },
      };
    }

    // Level 2 & 3 mosaic problem
    return {
      type: 'repte_visual',
      id: makeId('vis'),
      difficulty,
      subtitle: 'Rehabilitació d’un mosaic hidràulic',
      conceptTip: 'Quan calculem una fracció d’una altra fracció (per exemple, la meitat de 4/12), multipliquem les dues fraccions.',
      challenge: {
        variant: 'image_context',
        imageUrl: mosaicTilesImg,
        imageAlt: 'Mosaic de 12 rajoles hidràuliques en una graella de 4 per 3',
        imageCaption: '12 rajoles: 3 terracota, 5 blaves i 4 clares',
        story:
          'En aquest terra de 12 rajoles, 1/4 són terracota i 1/3 són clares. La restauradora vol substituir la meitat (1/2) de les rajoles clares per rajoles noves. Quina fracció total del terra quedarà sense cap canvi (terracota + blaves + la meitat de les clares)?',
        steps: [
          {
            kind: 'single_frac',
            id: 'half_light',
            prompt: 'Pas 1: Quina fracció del total representen les rajoles clares que SÍ que es canvien (1/2 de 1/3)?',
            hint: 'Multiplica 1/2 × 1/3.',
            expected: { n: 1, d: 6 },
            requireReduced: true,
          },
          {
            kind: 'single_frac',
            id: 'unchanged_total',
            prompt: 'Pas 2: Si el terra complet és 1 (12/12), resta-hi la fracció substituïda per saber quanta part queda intacta:',
            hint: 'Calcula 1 − 1/6.',
            expected: { n: 5, d: 6 },
            requireReduced: true,
          },
        ],
        finalAnswer: { n: 5, d: 6 },
      },
    };
  }

  if (choice === 'tart_image') {
    if (difficulty === 1) {
      return {
        type: 'repte_visual',
        id: makeId('vis'),
        difficulty: 1,
        subtitle: 'Porcions d’un pastís de fruites',
        conceptTip: 'El pastís està tallat en 8 parts iguals. Passa qualsevol altra fracció a vuitens (denominador 8) per comparar.',
        challenge: {
          variant: 'image_context',
          imageUrl: bakeryCocaImg,
          imageAlt: 'Pastís rodó de fruites tallat en 8 porcions iguals sobre pedra clara',
          imageCaption: 'Pastís dividit en 8 porcions iguals',
          story:
            'Aquest pastís té 8 porcions iguals. Al berenar en mengen 1/4 del pastís i després 3/8 més. Quina fracció de pastís queda al plat?',
          steps: [
            {
              kind: 'single_frac',
              id: 'eaten',
              prompt: 'Pas 1: Quina fracció de pastís s’han menjat en total (1/4 + 3/8)?',
              hint: 'Passa 1/4 a 2/8 i suma-hi 3/8.',
              expected: { n: 5, d: 8 },
              requireReduced: true,
            },
            {
              kind: 'single_frac',
              id: 'leftover',
              prompt: 'Pas 2: Quina fracció de pastís queda sense menjar?',
              hint: 'Resta del pastís sencer (8/8) la fracció menjada.',
              expected: { n: 3, d: 8 },
              requireReduced: true,
            },
          ],
          finalAnswer: { n: 3, d: 8 },
        },
      };
    }

    return {
      type: 'repte_visual',
      id: makeId('vis'),
      difficulty,
      subtitle: 'Repartiment en dues rondes',
      conceptTip: 'Vigila: la segona fracció es calcula sobre el pastís que QUEDAVA, no sobre el pastís sencer.',
      challenge: {
        variant: 'image_context',
        imageUrl: bakeryCocaImg,
        imageAlt: 'Pastís rodó de fruites tallat en 8 porcions iguals',
        imageCaption: 'Pastís dividit en 8 porcions iguals',
        story:
          'Del pastís de 8 porcions, primer s’en mengen 1/4. De la part que sobra, se’n reparteix 1/3 per emportar. Quina fracció del pastís original queda al final?',
        steps: [
          {
            kind: 'single_frac',
            id: 'after_first',
            prompt: 'Pas 1: Quina fracció queda després de menjar-ne 1/4?',
            hint: '1 − 1/4 = 3/4.',
            expected: { n: 3, d: 4 },
            requireReduced: true,
          },
          {
            kind: 'single_frac',
            id: 'taken_away',
            prompt: 'Pas 2: Quant és 1/3 del que quedava (1/3 × 3/4)?',
            hint: 'Multiplica 1/3 × 3/4 i simplifica.',
            expected: { n: 1, d: 4 },
            requireReduced: true,
          },
          {
            kind: 'single_frac',
            id: 'final_left',
            prompt: 'Pas 3: Quina fracció del pastís original queda al final?',
            hint: 'Resta del que quedava (3/4) el que s’han emportat (1/4) i simplifica.',
            expected: { n: 1, d: 2 },
            requireReduced: true,
          },
        ],
        finalAnswer: { n: 1, d: 2 },
      },
    };
  }

  if (choice === 'trail_image') {
    const isHard = difficulty >= 2;
    return {
      type: 'repte_visual',
      id: makeId('vis'),
      difficulty,
      subtitle: 'Etapes d’una ruta de muntanya',
      conceptTip: 'Quan sumem trams d’un recorregut total (1), el tram final és 1 menys la suma dels trams previs.',
      challenge: {
        variant: 'image_context',
        imageUrl: mountainTrailImg,
        imageAlt: 'Mapa topogràfic d’una ruta de muntanya dividida en trams',
        imageCaption: 'Perfil cartogràfic d’una ruta en etapes fraccionàries',
        story: isHard
          ? 'Un grup ciclista fa una ruta en 3 etapes. El primer tram ocupa 2/5 del recorregut i el segon tram 1/3. Si al tercer tram punxen una roda quan portaven 3/4 d’aquest últim tram, quina fracció del recorregut TOTAL els falta per arribar?'
          : 'Un grup excursionista fa una ruta en 3 trams. Al matí recorren 1/3 de la ruta i després de dinar en fan 2/5 més. Quina fracció del recorregut total els queda per fer a l’últim tram?',
        steps: isHard
          ? [
              {
                kind: 'single_frac',
                id: 'first_two',
                prompt: 'Pas 1: Suma les dues primeres etapes (2/5 + 1/3):',
                hint: 'El m.c.m. de 5 i 3 és 15.',
                expected: { n: 11, d: 15 },
                requireReduced: true,
              },
              {
                kind: 'single_frac',
                id: 'third_stage',
                prompt: 'Pas 2: Quina fracció representa tot el tercer tram (1 − 11/15)?',
                hint: '15/15 − 11/15.',
                expected: { n: 4, d: 15 },
                requireReduced: true,
              },
              {
                kind: 'single_frac',
                id: 'remaining_quarter',
                prompt: 'Pas 3: Si han completat 3/4 del tercer tram, els falta 1/4 d’aquest tram. Calcula 1/4 × 4/15:',
                hint: 'Multiplica i simplifica el 4 del numerador amb el 4 del denominador.',
                expected: { n: 1, d: 15 },
                requireReduced: true,
              },
            ]
          : [
              {
                kind: 'single_frac',
                id: 'done_trail',
                prompt: 'Pas 1: Quina fracció de la ruta han fet entre els dos primers trams (1/3 + 2/5)?',
                hint: 'Passa a denominador 15: 5/15 + 6/15.',
                expected: { n: 11, d: 15 },
                requireReduced: true,
              },
              {
                kind: 'single_frac',
                id: 'left_trail',
                prompt: 'Pas 2: Quina fracció els falta per completar el total (1)?',
                hint: '15/15 − 11/15.',
                expected: { n: 4, d: 15 },
                requireReduced: true,
              },
            ],
        finalAnswer: isHard ? { n: 1, d: 15 } : { n: 4, d: 15 },
      },
    };
  }

  if (choice === 'area_builder') {
    const rows = pickRandom([2, 3, 4, 5]);
    const cols = pickRandom([3, 4, 5, 6].filter((c) => c !== rows));
    const a = makeProperFrac(rows);
    const b = makeProperFrac(cols);
    const prod = mul(a, b);

    return {
      type: 'repte_visual',
      id: makeId('vis'),
      difficulty,
      subtitle: 'Model d’àrea interactiu (multiplicació)',
      conceptTip: 'Multiplicar dues fraccions correspon a l’àrea d’un rectangle de costats a/b i c/d dins d’un quadrat unitat.',
      challenge: {
        variant: 'area_grid_builder',
        rows,
        cols,
        targetA: a,
        targetB: b,
        story: `Construeix visualment la multiplicació ${formatFracText(a)} × ${formatFracText(b)}: selecciona a la graella les files i columnes que representen la zona d’encreuament i escriu la fracció irreductible resultant.`,
        finalAnswer: prod,
      },
    };
  }

  // strip_builder
  const denom = pickRandom([4, 6, 8, 10, 12]);
  const op = pickRandom<'+' | '-'>(['+', '-']);
  let n1 = randInt(1, denom - 2);
  let n2 = randInt(1, denom - n1);
  if (op === '-') {
    n1 = randInt(3, denom - 1);
    n2 = randInt(1, n1 - 1);
  }
  const f1 = simplify({ n: n1, d: denom });
  const f2 = simplify({ n: n2, d: denom });
  const total = applyOp(f1, op, f2);

  return {
    type: 'repte_visual',
    id: makeId('vis'),
    difficulty,
    subtitle: 'Tira fraccionària interactiva',
    conceptTip: 'Subdividir la unitat en parts iguals (fins a 12) permet visualitzar directament com s’afegeixen o es treuen porcions.',
    challenge: {
      variant: 'strip_builder',
      denominator: denom,
      left: f1,
      right: f2,
      op,
      story: `Pinta a la barra de ${denom} segments la fracció resultant de calcular ${formatFracText(f1)} ${op} ${formatFracText(f2)}, i després expressa el resultat en forma irreductible.`,
      finalAnswer: total,
    },
  };
}

// ---------------------------------------------------------------------------
// PUBLIC GENERATOR API
// ---------------------------------------------------------------------------

export function generateExercise(
  type: ExerciseType,
  difficulty: Difficulty,
  visualCounter = 0
): Exercise {
  switch (type) {
    case 'pas_a_pas':
      return generatePasAPas(difficulty);
    case 'detecta_errada':
      return generateDetectaErrada(difficulty);
    case 'nombre_falta':
      return generateNombreFalta(difficulty);
    case 'repte_visual':
      return generateRepteVisual(difficulty, visualCounter);
  }
}

export const EXERCISE_CYCLE: ExerciseType[] = [
  'pas_a_pas',
  'detecta_errada',
  'nombre_falta',
  'repte_visual',
];
