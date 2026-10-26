/** Small seeded PRNG (mulberry32) so every bootstrap and Monte Carlo result is exactly reproducible. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash of a string, used to derive a seed from a policy's identity. */
export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function standardNormal(random: () => number): number {
  // Box–Muller
  const u = Math.max(random(), 1e-12);
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Gamma(shape≥1, 1) by Marsaglia–Tsang, used to draw Dirichlet weights. */
export function gamma(shape: number, random: () => number): number {
  if (shape < 1) return gamma(shape + 1, random) * Math.pow(random(), 1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number;
    let v: number;
    do {
      x = standardNormal(random);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = random();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

/**
 * One draw from Dirichlet(α,…,α): random non-negative weights summing to 1, centred on equal weights.
 * Larger α means tighter around equal weights. With k indicators each weight has relative standard
 * deviation sqrt((k−1)/(kα+1)); α = 10 gives roughly ±25% for k = 3 and ±30% for k = 6.
 */
export function dirichletCentred(k: number, alpha: number, random: () => number): number[] {
  const draws = Array.from({ length: k }, () => gamma(alpha, random));
  const total = draws.reduce((a, b) => a + b, 0);
  return draws.map((value) => value / total);
}
