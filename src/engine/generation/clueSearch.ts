import { propagateClues } from '../solving/propagate.js';
import { enumerateCardClues, enumerateSceneClues } from '../clues/enumerate.js';
import { buildOccupancy } from '../clues/occupancy.js';
import {
  DIFFICULTY_BANDS, INDIRECT_CLUE_TYPES, meetsBand, vocabularyFor,
} from '../core/difficulty.js';
import type { SceneIndex } from '../core/grid.js';
import type { Rng } from '../core/rng.js';
import type {
  Assignment, Clue, ClueEntry, DifficultyKey, DifficultyProof, Suspect, SuspectId,
} from '../core/types.js';
import { type CandidateState, RoomView, createInitialState } from '../solving/candidates.js';
import { measureSpread, solve, type SolveResult } from '../solving/solve.js';

/**
 * Choosing which clues a puzzle ships with.
 *
 * The pool only ever contains clues that are *true* for the solution, so
 * correctness is never in question here — the search is about difficulty. It
 * runs in phases: start with the sharpest clue on every card, repair whatever
 * still leaves the solver stuck, then deliberately weaken as far as solvability
 * allows. The weakest still-solvable set is the most interesting one, because
 * every clue in it is doing work.
 */

/** Solver runs allowed per search. Reached only by pathological scenes. */
const DEFAULT_SOLVER_BUDGET = 2500;
/** How many of the strongest alternatives a repair step tries per card. */
const REPAIR_ALTERNATIVES = 8;
/** Representatives kept per clue group, spread across the strength range. */
const POOL_REPRESENTATIVES = 4;

export interface ScoredClue {
  clue: Clue;
  /** Cells this clue alone removes from its subject's candidate set. */
  strength: number;
}

export interface ClueSearchDiagnostics {
  solverRuns: number;
  /** Whether any set at all was found solvable, before tier thresholds. */
  reachedSolvable: boolean;
}

export type ClueSearchOutcome =
  | {
    ok: true;
    clues: ClueEntry[];
    solveResult: SolveResult;
    proof: DifficultyProof;
    diagnostics: ClueSearchDiagnostics;
  }
  | {
    ok: false;
    reason: 'noCluesAvailable' | 'notSolvable' | 'tierNotMet';
    diagnostics: ClueSearchDiagnostics;
  };

export function countIndirectClues(clues: readonly ClueEntry[]): number {
  return clues.filter((entry) => entry.ownerId !== null && INDIRECT_CLUE_TYPES.has(entry.clue.type)).length;
}

export function buildProof(
  index: SceneIndex,
  suspects: readonly Suspect[],
  clues: readonly ClueEntry[],
  attempts: number,
): DifficultyProof {
  return {
    spread: measureSpread(index, suspects, clues),
    indirect: countIndirectClues(clues),
    attempts,
  };
}

/**
 * How much a clue narrows things down on its own: candidates removed from its
 * subject when it is the only clue in play. Comparable across clue types,
 * which is what lets the search reason about "stronger" and "weaker".
 */
function scoreClue(
  index: SceneIndex,
  suspects: readonly Suspect[],
  ownerId: SuspectId,
  clue: Clue,
): number {
  const state: CandidateState = createInitialState(index, suspects.length);
  const rooms = new RoomView(index, state);
  const before = state.countFor(ownerId);
  propagateClues(index, state, rooms, [{ ownerId, clue }]);
  return before - state.countFor(ownerId);
}

/** Clues that read alike are grouped, so variants of one phrasing do not crowd out others. */
function groupKeyOf(clue: Clue): string {
  if (clue.type === 'ADJACENT_OBJECT') return clue.count === undefined ? 'ADJACENT_ANY' : 'ADJACENT_EXACT';
  return clue.type;
}

/**
 * Keep a few representatives per group, spread evenly across the strength
 * range. Keeps the search fast and stops a card's options from being five
 * near-identical direction clues.
 */
function thinPool(scored: readonly ScoredClue[], perGroup = POOL_REPRESENTATIVES): ScoredClue[] {
  const groups = new Map<string, ScoredClue[]>();
  for (const entry of scored) {
    const key = groupKeyOf(entry.clue);
    const group = groups.get(key);
    if (group) group.push(entry);
    else groups.set(key, [entry]);
  }

  const kept: ScoredClue[] = [];
  for (const group of groups.values()) {
    if (group.length <= perGroup) {
      kept.push(...group);
      continue;
    }
    for (let slot = 0; slot < perGroup; slot++) {
      const position = Math.round((slot * (group.length - 1)) / (perGroup - 1));
      kept.push(group[position]!);
    }
  }
  return kept.sort((a, b) => a.strength - b.strength);
}

/**
 * The search state: one chosen index per card, plus the scene clues in play.
 *
 * Phases are methods rather than a single long function, and every phase
 * reports whether it changed anything — which is what the loop conditions
 * elsewhere used to have to infer.
 */
class ClueSearch {
  private readonly pools: ScoredClue[][] = [];
  private readonly chosen: number[] = [];
  private sceneClues: ClueEntry[] = [];
  private solverRuns = 0;
  private latest: SolveResult;

  constructor(
    private readonly rng: Rng,
    private readonly index: SceneIndex,
    private readonly suspects: readonly Suspect[],
    solution: Assignment,
    private readonly difficulty: DifficultyKey,
    private readonly budget: number,
  ) {
    const occupancy = buildOccupancy(index, solution);
    const vocabulary = vocabularyFor(difficulty);

    for (let suspect = 0; suspect < suspects.length; suspect++) {
      const clues = enumerateCardClues(index, suspects, occupancy, suspect, vocabulary);
      const scored = rng
        .shuffled(clues)
        .map((clue) => ({ clue, strength: scoreClue(index, suspects, suspect, clue) }))
        .sort((a, b) => a.strength - b.strength);
      // The victim's card is fixed, so it is never thinned or swapped.
      this.pools.push(suspects[suspect]?.isVictim ? scored : thinPool(scored));
    }

    this.availableSceneClues = rng.shuffled(enumerateSceneClues(index, occupancy, vocabulary));
    this.chosen = this.pools.map((pool) => pool.length - 1);
    this.latest = this.run();
  }

  private readonly availableSceneClues: ClueEntry[];

  get hasEmptyPool(): boolean {
    return this.pools.some((pool) => pool.length === 0);
  }

  get runs(): number {
    return this.solverRuns;
  }

  get result(): SolveResult {
    return this.latest;
  }

  /** Has the solver budget been used up? */
  private outOfBudget(): boolean {
    return this.solverRuns >= this.budget;
  }

  clues(): ClueEntry[] {
    return [
      ...this.chosen.map((position, suspect) => ({
        ownerId: suspect,
        clue: this.pools[suspect]![position]!.clue,
      })),
      ...this.sceneClues,
    ];
  }

  private run(): SolveResult {
    this.solverRuns++;
    this.latest = solve(this.index, this.suspects, this.clues());
    return this.latest;
  }

  private isVictim(suspect: SuspectId): boolean {
    return this.suspects[suspect]?.isVictim ?? false;
  }

  private totalRemaining(result: SolveResult): number {
    let total = 0;
    for (const suspect of this.suspects) total += result.state.countFor(suspect.id);
    return total;
  }

  /**
   * Phase 1 — give every card its sharpest clue, avoiding repeated wording.
   *
   * Two cards reading the same is a genuine symmetry: whichever way the two
   * people swap, both readings hold, so the puzzle has more than one solution.
   */
  chooseDistinctStrongest(): void {
    const taken = new Set<string>();
    for (const suspect of this.rng.shuffledIndices(this.suspects.length)) {
      const pool = this.pools[suspect] ?? [];
      let position = this.chosen[suspect] ?? 0;
      for (let candidate = pool.length - 1; candidate >= 0; candidate--) {
        const wording = JSON.stringify(pool[candidate]?.clue);
        if (!taken.has(wording)) {
          position = candidate;
          break;
        }
      }
      this.chosen[suspect] = position;
      taken.add(JSON.stringify(pool[position]?.clue));
    }
    this.run();
  }

  /** Phase 2 — add scene clues until the puzzle becomes solvable. */
  addSceneCluesUntilSolvable(): void {
    const maxSceneClues = Math.max(3, Math.ceil(this.index.size / 2));
    for (const candidate of this.availableSceneClues) {
      if (this.latest.status === 'solved') return;
      if (this.sceneClues.length >= maxSceneClues) return;
      this.sceneClues = [...this.sceneClues, candidate];
      this.run();
    }
  }

  /**
   * Phase 3 — repair the cards that leave the most uncertainty.
   *
   * Tries the strongest alternatives and keeps whichever shrinks the total
   * remaining candidates the most, which converges much faster than swapping
   * blindly.
   */
  repairUncertainCards(): void {
    let round = 0;
    while (round < this.suspects.length) {
      round++;
      if (this.latest.status === 'solved' || this.outOfBudget()) return;

      const uncertain = Array.from({ length: this.suspects.length }, (_, suspect) => suspect)
        .filter((suspect) => !this.isVictim(suspect) && this.latest.state.countFor(suspect) > 1)
        .sort((a, b) => this.latest.state.countFor(b) - this.latest.state.countFor(a));
      if (uncertain.length === 0) return;

      let improvedAnything = false;
      for (const suspect of uncertain) {
        const pool = this.pools[suspect] ?? [];
        const original = this.chosen[suspect] ?? 0;
        let bestPosition = original;
        let bestRemaining = this.totalRemaining(this.latest);
        let bestResult = this.latest;

        const lowest = Math.max(0, pool.length - REPAIR_ALTERNATIVES);
        for (let candidate = pool.length - 1; candidate >= lowest && !this.outOfBudget(); candidate--) {
          if (candidate === original) continue;
          this.chosen[suspect] = candidate;
          const attempt = this.run();
          if (attempt.status === 'contradiction') continue;
          if (attempt.status === 'solved') {
            bestPosition = candidate;
            bestResult = attempt;
            bestRemaining = -1;
            break;
          }
          const remaining = this.totalRemaining(attempt);
          if (remaining < bestRemaining) {
            bestPosition = candidate;
            bestRemaining = remaining;
            bestResult = attempt;
          }
        }

        this.chosen[suspect] = bestPosition;
        this.latest = bestResult;
        if (bestPosition !== original) improvedAnything = true;
        if (this.latest.status === 'solved') return;
      }
      if (!improvedAnything) return;
    }
  }

  /**
   * Phase 4 — weaken greedily while the puzzle stays solvable.
   *
   * What remains is the hardest set this solution admits: every clue still
   * present is one the solver genuinely needs.
   */
  weakenWhileSolvable(): void {
    let progressed = true;
    while (progressed && !this.outOfBudget()) {
      progressed = false;
      for (const suspect of this.rng.shuffledIndices(this.suspects.length)) {
        if (this.isVictim(suspect)) continue;
        while ((this.chosen[suspect] ?? 0) > 0 && !this.outOfBudget()) {
          const original = this.chosen[suspect]!;
          this.chosen[suspect] = original - 1;
          const attempt = this.run();
          if (attempt.status === 'solved') {
            this.latest = attempt;
            progressed = true;
          } else {
            this.chosen[suspect] = original;
            break;
          }
        }
      }
    }
  }

  /** Phase 5 — drop scene clues that are no longer carrying their weight. */
  dropRedundantSceneClues(): void {
    for (const candidate of [...this.sceneClues]) {
      const kept = this.sceneClues;
      this.sceneClues = kept.filter((entry) => entry !== candidate);
      const attempt = this.run();
      if (attempt.status === 'solved') this.latest = attempt;
      else this.sceneClues = kept;
    }
  }

  /**
   * Phase 6 — trade direct clues for indirect ones until the tier's minimum is
   * met. This is what separates tiers of the same grid size: not more clues,
   * but clues that need combining rather than looking up.
   */
  preferIndirectClues(): void {
    const required = DIFFICULTY_BANDS[this.difficulty].minIndirect;

    let round = 0;
    while (round < this.suspects.length) {
      round++;
      if (countIndirectClues(this.clues()) >= required || this.outOfBudget()) return;

      let swapped = false;
      for (const suspect of this.rng.shuffledIndices(this.suspects.length)) {
        if (this.isVictim(suspect)) continue;
        const pool = this.pools[suspect] ?? [];
        const original = this.chosen[suspect] ?? 0;
        if (INDIRECT_CLUE_TYPES.has((pool[original]!).clue.type)) continue;

        for (let candidate = pool.length - 1; candidate >= 0 && !this.outOfBudget(); candidate--) {
          if (!INDIRECT_CLUE_TYPES.has((pool[candidate]!).clue.type)) continue;
          this.chosen[suspect] = candidate;
          const attempt = this.run();
          if (attempt.status === 'solved') {
            this.latest = attempt;
            swapped = true;
            break;
          }
          this.chosen[suspect] = original;
        }
        if (swapped) break;
      }
      if (!swapped) return;
    }
  }
}

/**
 * Find a clue set that hits the requested difficulty tier, or explain why it
 * could not. Never returns an unsolvable or untrue set.
 */
export function searchClues(
  rng: Rng,
  index: SceneIndex,
  suspects: readonly Suspect[],
  solution: Assignment,
  difficulty: DifficultyKey,
  budget: number = DEFAULT_SOLVER_BUDGET,
): ClueSearchOutcome {
  const search = new ClueSearch(rng, index, suspects, solution, difficulty, budget);
  const diagnostics = (): ClueSearchDiagnostics => ({
    solverRuns: search.runs,
    reachedSolvable: search.result.status === 'solved',
  });

  if (search.hasEmptyPool) return { ok: false, reason: 'noCluesAvailable', diagnostics: diagnostics() };

  search.chooseDistinctStrongest();
  search.addSceneCluesUntilSolvable();
  search.repairUncertainCards();
  if (search.result.status !== 'solved') {
    return { ok: false, reason: 'notSolvable', diagnostics: diagnostics() };
  }

  search.weakenWhileSolvable();
  search.dropRedundantSceneClues();
  search.preferIndirectClues();

  const clues = search.clues();
  const proof = buildProof(index, suspects, clues, 0);
  if (!meetsBand(difficulty, index.size, proof)) {
    return { ok: false, reason: 'tierNotMet', diagnostics: diagnostics() };
  }

  return { ok: true, clues, solveResult: search.result, proof, diagnostics: diagnostics() };
}
