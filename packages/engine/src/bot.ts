import { cardKey, makeDeck, rankLabel } from "./cards.js";
import { formatTokens } from "./format.js";
import { personaById, styleForPersona, type PlayStyle } from "./personas.js";
import { holeKind, isAceKing, orderedRanks } from "./rules.js";
import { computeBetRange, currentPlayer } from "./table.js";
import type { BetRange, Card, OutcomeKind, Player, PlayerAction, Rank, TableState } from "./types.js";

export type BubbleMood = "calm" | "bold" | "wary" | "tilt" | "joy";

export interface SeatBubble {
  id: number;
  text: string;
  kind: "think" | "react";
  mood?: BubbleMood;
}

export interface BotThoughtBeat {
  /** Milliseconds after the turn begins to display this thought. */
  atMs: number;
  text: string;
  mood?: BubbleMood;
}

export interface BotEmotion {
  winStreak: number;
  loseStreak: number;
  /** 2 = very last resolved turn was a horn, 1 = within recent turns, 0 = none. */
  recentHorn: 0 | 1 | 2;
  /** Session profit/loss relative to starting tokens. */
  sessionDelta: number;
  /** Current hand profit/loss relative to ante. */
  handDelta: number;
  /** -1 (tightened/cooled) to +1 (heated/confident/tilted). */
  heat: number;
  /** Dramatic event just seen on the table from another player. */
  tableDrama: "horn" | "triple_win" | "big_win" | null;
}

export interface SpotEval {
  unitEv: number;
  pWin: number;
  pHorn: number;
  pLose: number;
  kind: ReturnType<typeof holeKind>;
  gap: number;
  isAK: boolean;
  seenHornsInOrbit: number;
  seenWinsInOrbit: number;
  deadPair: boolean;
  poolRatio: number;
  canClearPool: boolean;
  dealsLeft: number;
  stackHealth: number;
  hornCapRelief: boolean;
}

export interface BotTurnPlan {
  action: PlayerAction;
  thinkMs: number;
  thoughts: BotThoughtBeat[];
  emotion: BotEmotion;
  spot: SpotEval | null;
}

export interface TableReaction {
  playerId: string;
  text: string;
  delayMs: number;
  mood: BubbleMood;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function countRank(cards: readonly Card[], rank: Rank): number {
  let n = 0;
  for (const c of cards) {
    if (c.rank === rank) n += 1;
  }
  return n;
}

function otherVisibleOrbitCards(state: TableState, actorId: string | undefined): Card[] {
  const seen: Card[] = [];
  for (const [pid, cards] of Object.entries(state.lastCards)) {
    if (pid === actorId) continue;
    seen.push(cards.hole[0], cards.hole[1]);
    if (cards.third) seen.push(cards.third);
  }
  return seen;
}

function freshRemainingDeck(hole: [Card, Card]): Card[] {
  const a = cardKey(hole[0]);
  const b = cardKey(hole[1]);
  return makeDeck().filter((c) => {
    const k = cardKey(c);
    return k !== a && k !== b;
  });
}

function evalDeck(
  hole: [Card, Card],
  remain: readonly Card[],
  pool: number,
  range: BetRange | null,
): { unitEv: number; pWin: number; pHorn: number; pLose: number; gap: number; isAK: boolean; deadPair: boolean } {
  const kind = holeKind(hole[0], hole[1]);
  const total = Math.max(1, remain.length);

  if (kind === "pair") {
    const hits = countRank(remain, hole[0].rank);
    const pHit = hits / total;
    const stake = range?.min ?? 1;
    const ev = pHit * pool - (1 - pHit) * stake;
    return {
      unitEv: ev / Math.max(stake, 1),
      pWin: pHit,
      pHorn: 0,
      pLose: 1 - pHit,
      gap: 0,
      isAK: false,
      deadPair: hits === 0,
    };
  }

  const { low, high } = orderedRanks(hole[0], hole[1]);
  const gap = Math.max(0, high - low - 1);
  const ak = isAceKing(hole[0], hole[1]);
  let win = 0;
  let horn = 0;
  let lose = 0;
  for (const card of remain) {
    if (card.rank === hole[0].rank || card.rank === hole[1].rank) horn += 1;
    else if (card.rank > low && card.rank < high) win += 1;
    else lose += 1;
  }
  const pWin = win / total;
  const pHorn = horn / total;
  const pLose = lose / total;
  const mult = ak ? 4 : 2;
  return {
    unitEv: pWin - pLose - pHorn * mult,
    pWin,
    pHorn,
    pLose,
    gap,
    isAK: ak,
    deadPair: false,
  };
}

export function evaluateSpot(state: TableState): SpotEval | null {
  if (!state.hole) return null;
  const hole = state.hole;
  const kind = holeKind(hole[0], hole[1]);
  const range = computeBetRange(state);
  const player = currentPlayer(state);
  const remain = state.deck.length > 0 ? state.deck : freshRemainingDeck(hole);
  const base = evalDeck(hole, remain, state.projectPool, range);

  const visibleOthers = otherVisibleOrbitCards(state, player?.id);
  const { low, high } = orderedRanks(hole[0], hole[1]);
  let seenHornsInOrbit = 0;
  let seenWinsInOrbit = 0;
  for (const c of visibleOthers) {
    if (c.rank === hole[0].rank || c.rank === hole[1].rank) seenHornsInOrbit += 1;
    else if (kind === "spread" && c.rank > low && c.rank < high) seenWinsInOrbit += 1;
  }

  const basePot = Math.max(1, state.config.ante * state.players.length);
  const poolRatio = state.projectPool / basePot;
  const canClearPool = Boolean(
    range && !range.locked && state.projectPool >= range.min && state.projectPool <= range.max,
  );
  const dealsLeft = Math.max(0, state.config.dealsUntilSplit - state.dealsThisHand);
  const stackHealth = (player?.tokens ?? state.config.startingTokens) / Math.max(1, state.config.startingTokens);
  const hornCapRelief = Boolean(
    base.isAK && range && !range.locked && range.max * 4 > state.config.maxLoss,
  );

  return {
    kind,
    unitEv: base.unitEv,
    pWin: base.pWin,
    pHorn: base.pHorn,
    pLose: base.pLose,
    gap: base.gap,
    isAK: base.isAK,
    seenHornsInOrbit,
    seenWinsInOrbit,
    deadPair: base.deadPair,
    poolRatio,
    canClearPool,
    dealsLeft,
    stackHealth,
    hornCapRelief,
  };
}

/** Infer live emotional momentum from recent table history without mutating TableState. */
export function inferBotEmotion(state: TableState, playerId: string): BotEmotion {
  const player = state.players.find((p) => p.id === playerId);
  const style = styleForPersona(player?.personaId);
  let winStreak = 0;
  let loseStreak = 0;
  let recentHorn: 0 | 1 | 2 = 0;
  let seenOwnResolved = 0;
  let tableDrama: BotEmotion["tableDrama"] = null;

  for (let i = state.logs.length - 1; i >= 0; i--) {
    const entry = state.logs[i]!;
    if (
      !tableDrama &&
      entry.playerId &&
      entry.playerId !== playerId &&
      (entry.kind === "horn" || entry.kind === "triple_win" || (entry.kind === "win" && (entry.amount ?? 0) >= 60_000))
    ) {
      if (entry.kind === "horn") tableDrama = "horn";
      else if (entry.kind === "triple_win") tableDrama = "triple_win";
      else tableDrama = "big_win";
    }

    if (entry.playerId !== playerId) continue;
    const isWin = entry.kind === "win" || entry.kind === "triple_win";
    const isLoss = entry.kind === "lose" || entry.kind === "triple_lose" || entry.kind === "horn";
    if (!isWin && !isLoss) continue;

    seenOwnResolved += 1;
    if (entry.kind === "horn") {
      if (seenOwnResolved === 1) recentHorn = 2;
      else if (seenOwnResolved <= 3 && recentHorn === 0) recentHorn = 1;
    }

    if (seenOwnResolved === 1) {
      if (isWin) winStreak = 1;
      else loseStreak = 1;
    } else if (winStreak > 0 && isWin && loseStreak === 0) {
      winStreak += 1;
    } else if (loseStreak > 0 && isLoss && winStreak === 0) {
      loseStreak += 1;
    } else if (seenOwnResolved >= 4) {
      break;
    }
  }

  const startTokens = Math.max(1, state.config.startingTokens);
  const handStart = state.tokensAtHandStart[playerId] ?? player?.tokens ?? startTokens;
  const sessionDelta = ((player?.tokens ?? startTokens) - startTokens) / startTokens;
  const handDelta = ((player?.tokens ?? handStart) - handStart) / Math.max(1, state.config.ante);

  let heat = 0;
  if (winStreak > 0) {
    heat += Math.min(0.65, winStreak * 0.24) * style.streakDrive;
  }
  if (recentHorn > 0) {
    heat += (recentHorn === 2 ? 0.55 : 0.28) * style.tiltBias;
  } else if (loseStreak >= 2) {
    heat += Math.min(0.45, loseStreak * 0.16) * style.tiltBias;
  }
  if (sessionDelta > 0.25) {
    heat += 0.12 * style.streakDrive;
  } else if (sessionDelta < -0.35) {
    heat += 0.18 * style.tiltBias;
  }

  return {
    winStreak,
    loseStreak,
    recentHorn,
    sessionDelta,
    handDelta,
    heat: clamp(heat, -1, 1),
    tableDrama,
  };
}

function perceivedEv(state: TableState, spot: SpotEval, style: PlayStyle, range: BetRange): number {
  if (!state.hole) return spot.unitEv;
  const fresh = evalDeck(state.hole, freshRemainingDeck(state.hole), state.projectPool, range);
  // Blend intuitive baseline spread read with true visible-orbit card counting by `cardSense`.
  let ev = fresh.unitEv * (1 - style.cardSense) + spot.unitEv * style.cardSense;

  // Analytical/bold players notice that A-K 4x super-horn is capped by maxLoss near maxAdd.
  if (spot.hornCapRelief && style.cardSense >= 0.65) {
    ev += 0.08 * (1 - style.hornFear * 0.5);
  }
  return ev;
}

function effectiveFoldLine(style: PlayStyle, spot: SpotEval, emotion: BotEmotion): number {
  let line = style.foldBelow;

  // Emotional drift: heated/tilted bots loosen up slightly; cooled bots tighten up.
  line -= emotion.heat * 0.065;

  // Fat pool makes borderline spots slightly more alluring for pot-hungry personas.
  if (spot.poolRatio > 1.25) {
    line -= Math.min(0.06, (spot.poolRatio - 1.25) * 0.04) * style.potHunger;
  } else if (spot.poolRatio < 0.45) {
    line += 0.04 * (1 - style.potHunger * 0.5);
  }

  // Late in the 24-deal cycle: smart players avoid marginal leaks right before free split chips.
  if (spot.dealsLeft <= 4 && spot.poolRatio >= 0.85 && spot.unitEv < 0) {
    line += 0.06 * style.splitSense;
  }

  // Short-stack caution (unless heavily tilted).
  if (spot.stackHealth < 0.35 && emotion.heat < 0.35) {
    line += 0.05;
  }

  return line;
}

function shouldFold(
  style: PlayStyle,
  spot: SpotEval,
  pEv: number,
  emotion: BotEmotion,
): boolean {
  if (spot.kind === "pair") {
    // Sharp players notice when both remaining pair cards were already exposed this orbit.
    if (spot.deadPair && style.cardSense >= 0.55) return true;
    // Live pair: risking minAdd (5K) to sweep a big pool is thrilling and usually played.
    if (pEv > -0.15) return Math.random() < 0.04 * (1 - style.potHunger);
    const pairLine = style.foldBelow - 0.16 * style.potHunger;
    return pEv <= pairLine + (Math.random() * 2 - 1) * style.mood;
  }

  const wobble = (Math.random() * 2 - 1) * style.mood;
  const line = effectiveFoldLine(style, spot, emotion) + wobble;

  // Terrible spots (gap <= 2 like A-4) almost always fold, with tiny chaotic/tilt spice.
  if (pEv <= line) {
    if (spot.gap <= 2) {
      const spice = emotion.heat > 0.45 && style.archetype === "chaotic" ? 0.04 : 0;
      return Math.random() >= spice;
    }
    return true;
  }

  const over = pEv - line;
  if (over < 0.16 && Math.random() < style.scratch * (1 - over / 0.16)) {
    return true;
  }
  return false;
}

function heatFromEv(unitEv: number): number {
  return clamp((unitEv + 0.42) / 0.72, 0, 1);
}

function roundToStep(amount: number, step: number): number {
  return Math.round(amount / step) * step;
}

function snapHumanAmount(
  rawTarget: number,
  range: BetRange,
  state: TableState,
  player: Player,
  style: PlayStyle,
  spot: SpotEval,
): number {
  const clampLegal = (v: number) =>
    Math.min(range.max, Math.max(range.min, roundToStep(v, 1000) || range.min));

  const target = clampLegal(rawTarget);
  if (target <= range.min + 1500) return range.min;
  if (target >= range.max - 3000) return range.max;

  // Pot-clear instinct: when pool is reachable and the spot is solid, humans love an exact clean sweep.
  if (
    spot.canClearPool &&
    spot.pWin >= 0.62 &&
    Math.abs(target - state.projectPool) <= Math.max(15_000, range.max * 0.28)
  ) {
    const clearChance = 0.35 + style.potHunger * 0.45;
    if (Math.random() < clearChance) {
      return clampLegal(state.projectPool);
    }
  }

  // Playful lucky numbers (e.g. 66K, 88K, 18K) for festive/chaotic personas.
  if (style.sizeHabit === "lucky" && Math.random() < 0.28) {
    const luckies = [18_000, 28_000, 38_000, 66_000, 88_000].filter(
      (n) => n >= range.min && n <= range.max && Math.abs(n - target) <= 9_000,
    );
    if (luckies.length > 0) return pick(luckies);
  }

  // Build natural human anchors within legal range.
  const anchors: number[] = [range.min, range.max];
  const halfPool = roundToStep(state.projectPool / 2, 5_000);
  const quarterPool = roundToStep(state.projectPool / 4, 5_000);
  const thirdPool = roundToStep(state.projectPool / 3, 5_000);
  for (const a of [quarterPool, thirdPool, halfPool, state.projectPool]) {
    if (a >= range.min && a <= range.max) anchors.push(a);
  }

  // Round-stack anchor (e.g. leaving 400K or 350K cleanly).
  const roundStep = 25_000;
  const remainder = player.tokens % roundStep;
  if (remainder >= range.min && remainder <= range.max && Math.abs(remainder - target) <= 6_000) {
    anchors.push(remainder);
  }

  // Standard clean 5K/10K increments.
  const step = target >= 40_000 ? 10_000 : 5_000;
  anchors.push(clampLegal(roundToStep(target, step)));
  anchors.push(clampLegal(roundToStep(target, 5_000)));

  // Pick closest natural anchor with a small human wobble.
  if (style.sizeHabit === "pot" || style.sizeHabit === "fraction") {
    let best = anchors[0]!;
    let bestDist = Infinity;
    for (const a of anchors) {
      const d = Math.abs(a - target);
      if (d < bestDist) {
        bestDist = d;
        best = a;
      }
    }
    return clampLegal(best);
  }

  // Clean 5K/10K rounding for calm/nimble players.
  return clampLegal(roundToStep(target, step));
}

function pickAmount(
  range: BetRange,
  state: TableState,
  player: Player,
  style: PlayStyle,
  spot: SpotEval,
  pEv: number,
  emotion: BotEmotion,
): number {
  const heat = heatFromEv(pEv);
  const low = 0.05 + style.sizeBias * 0.08;
  const high = 0.34 + style.sizeBias * 0.6;
  let fraction = low + (high - low) * heat ** 0.9;

  // Emotional adjustment: hot/tilted pushes slightly harder; cooled-down pulls back.
  fraction *= 1 + emotion.heat * 0.14;

  // Fat pool encouragement.
  if (spot.poolRatio > 1.3 && pEv > -0.1) {
    fraction *= 1 + Math.min(0.16, (spot.poolRatio - 1.3) * 0.1) * style.potHunger;
  }

  // A-K 4x super-horn psychology:
  // Cautious players dial back slightly out of respect for 4x horn; bold/cap-aware players press!
  if (spot.isAK) {
    if (style.hornFear >= 0.7) {
      fraction *= 0.82;
    } else if (spot.hornCapRelief && style.cardSense >= 0.75) {
      fraction *= 1.12;
    }
  }

  // Clean one-shot pot clear temptation on good spots.
  if (spot.canClearPool && spot.pWin >= 0.68 && Math.random() < 0.25 + style.potHunger * 0.45) {
    return Math.min(range.max, Math.max(range.min, state.projectPool));
  }

  // High-confidence shove check.
  const akShoveAdjust = spot.isAK ? 1 - style.hornFear * 0.45 : 1;
  const shoveHeat =
    Math.max(0, (pEv - 0.18) / 0.22) * Math.max(0, (spot.pWin - 0.58) / 0.28);
  const shoveP = Math.min(
    0.78,
    style.shove * shoveHeat * akShoveAdjust * (1 + Math.max(0, emotion.heat) * 0.2),
  );
  if (Math.random() < shoveP) {
    return range.max;
  }

  fraction *= 1 + (Math.random() * 2 - 1) * 0.12;
  fraction = clamp(fraction, 0.04, 1);

  const raw = range.min + (range.max - range.min) * fraction;
  return snapHumanAmount(raw, range, state, player, style, spot);
}

function estimateThinkMs(
  style: PlayStyle,
  spot: SpotEval | null,
  emotion: BotEmotion,
  action?: PlayerAction,
): number {
  if (!spot) return Math.round((style.thinkMin + style.thinkMax) / 2);

  const dist = Math.abs(spot.unitEv - style.foldBelow);
  const triangular = (Math.random() + Math.random()) / 2;
  const span = Math.max(1200, style.thinkMax - style.thinkMin);

  // Easy hopeless fold (e.g. A-4, 2-4): snappy human glance & pass.
  if (spot.kind === "spread" && spot.gap <= 2 && action?.type === "fold") {
    const base = 1900 + triangular * 1400 + (style.archetype === "patient" ? 450 : 0);
    return Math.round(clamp(base * (1 - emotion.heat * 0.1), 1800, 3500));
  }

  // Pair: quick spark of excitement (or brief shake of head if dead).
  if (spot.kind === "pair") {
    const base = 2400 + triangular * 1600 + (spot.deadPair ? 500 : 0);
    return Math.round(clamp(base, 2200, 4400));
  }

  // Contested / medium / A-K / big-pot decisions genuinely tank so the table feels tension.
  const hesitation = Math.max(0, 1 - dist / 0.18);
  const akDrama = spot.isAK ? 1100 + style.hornFear * 700 : 0;
  const clearDrama = spot.canClearPool && spot.pWin >= 0.56 ? 600 : 0;
  const extraTank = Math.random() < 0.12 ? 700 + Math.random() * 1400 : 0;
  const quickGood = spot.gap >= 9 && !spot.isAK && Math.random() < 0.3 ? -600 : 0;
  const emotionFactor = 1 - emotion.heat * 0.12;

  const raw =
    (style.thinkMin +
      span * (0.18 + 0.54 * triangular) +
      hesitation * 1500 +
      akDrama +
      clearDrama +
      extraTank +
      quickGood) *
    emotionFactor;

  // Medium/borderline spots (like 3-J) stay comfortably >= 3600ms so players can watch the deliberation.
  const floor = spot.gap >= 3 && spot.gap <= 8 ? 3600 : 2800;
  return Math.round(clamp(raw, floor, 11_200));
}

function buildThoughtBeats(
  state: TableState,
  style: PlayStyle,
  spot: SpotEval,
  emotion: BotEmotion,
  action: PlayerAction,
  thinkMs: number,
  range: BetRange,
): BotThoughtBeat[] {
  const v = style.voices;
  const hole = state.hole!;
  const { low, high } = orderedRanks(hole[0], hole[1]);
  const lowLbl = rankLabel(low);
  const highLbl = rankLabel(high);
  const firstAt = Math.min(480, Math.round(thinkMs * 0.14));
  const secondAt = Math.round(thinkMs * (0.48 + Math.random() * 0.12));

  // Pair
  if (spot.kind === "pair") {
    if (action.type === "fold") {
      const line = spot.deadPair && style.cardSense >= 0.55
        ? `桌上看齐了 ${lowLbl}，弃`
        : pick(v.pairPass);
      return [{ atMs: firstAt, text: line, mood: "wary" }];
    }
    const line = Math.random() < 0.45 ? `对 ${lowLbl}！${formatTokens(range.min)} 冲通吃` : pick(v.pairHype);
    return [{ atMs: firstAt, text: line, mood: "bold" }];
  }

  // Easy trash fold (gap <= 2)
  if (spot.gap <= 2 && action.type === "fold") {
    const line = Math.random() < 0.4 ? `${lowLbl} 到 ${highLbl}，太窄了` : pick(v.trashFold);
    return [{ atMs: firstAt, text: line, mood: "calm" }];
  }

  const beats: BotThoughtBeat[] = [];

  // First beat: authentic reaction to the actual cards or table state
  if (spot.isAK) {
    beats.push({ atMs: firstAt, text: pick(v.akDrama), mood: style.hornFear > 0.6 ? "wary" : "bold" });
  } else if (emotion.recentHorn === 2 && Math.random() < 0.45) {
    beats.push({ atMs: firstAt, text: pick(v.afterHorn), mood: style.tiltBias > 0 ? "tilt" : "wary" });
  } else if (spot.seenHornsInOrbit >= 2 && style.cardSense >= 0.6 && Math.random() < 0.65) {
    beats.push({ atMs: firstAt, text: pick(v.cardRead), mood: "calm" });
  } else if (spot.canClearPool && spot.pWin >= 0.6 && Math.random() < 0.55) {
    beats.push({ atMs: firstAt, text: pick(v.clearPot), mood: "bold" });
  } else if (spot.poolRatio >= 1.45 && Math.random() < 0.45) {
    beats.push({ atMs: firstAt, text: pick(v.fatPool), mood: "bold" });
  } else if (spot.gap >= 8) {
    const line = Math.random() < 0.38 ? `${lowLbl} 到 ${highLbl}，区间挺宽` : pick(v.goodSpot);
    beats.push({ atMs: firstAt, text: line, mood: "bold" });
  } else {
    const line = Math.random() < 0.35 ? `${lowLbl} 到 ${highLbl}…中间 ${spot.gap} 个点` : pick(v.closeRead);
    beats.push({ atMs: firstAt, text: line, mood: "calm" });
  }

  // Second beat on longer tanks (>= 3400ms): shows real deliberation without spoiling too early
  if (thinkMs >= 3400 && secondAt < thinkMs - 950) {
    if (action.type === "fold") {
      beats.push({ atMs: secondAt, text: pick(v.closeBail), mood: "wary" });
    } else if (action.amount >= range.max && range.max > range.min * 2) {
      const boldSecond = spot.canClearPool && action.amount === state.projectPool
        ? "一口收锅！"
        : style.archetype === "calm" || style.archetype === "analyst"
          ? "胜面够，打满"
          : "心一横，拉满！";
      beats.push({ atMs: secondAt, text: boldSecond, mood: "bold" });
    } else if (action.amount <= range.min * 2 && spot.gap <= 6) {
      beats.push({ atMs: secondAt, text: pick(v.closeCommit), mood: "calm" });
    } else if (spot.isAK) {
      const akSecond =
        action.amount >= range.max * 0.75
          ? "机会难得，重注干"
          : "防一手四倍尖，打个稳数";
      beats.push({ atMs: secondAt, text: akSecond, mood: action.amount >= range.max * 0.75 ? "bold" : "wary" });
    } else if (spot.gap <= 7) {
      beats.push({ atMs: secondAt, text: pick(v.closeCommit), mood: "calm" });
    }
  }

  return beats;
}

/** Plan a complete, coherent bot turn (decision, realistic timing, and contextual thoughts). */
export function planBotTurn(state: TableState): BotTurnPlan {
  const player = currentPlayer(state);
  const emotion: BotEmotion = player
    ? inferBotEmotion(state, player.id)
    : { winStreak: 0, loseStreak: 0, recentHorn: 0, sessionDelta: 0, handDelta: 0, heat: 0, tableDrama: null };

  if (!player || state.phase !== "awaiting" || !state.hole) {
    return { action: { type: "fold" }, thinkMs: 2000, thoughts: [], emotion, spot: null };
  }
  const range = computeBetRange(state);
  const style = styleForPersona(player.personaId);
  const spot = evaluateSpot(state);
  if (!range || !spot) {
    return { action: { type: "fold" }, thinkMs: 2000, thoughts: [], emotion, spot };
  }

  const pEv = perceivedEv(state, spot, style, range);
  let action: PlayerAction;
  if (shouldFold(style, spot, pEv, emotion)) {
    action = { type: "fold" };
  } else if (range.locked) {
    action = { type: "add", amount: range.min };
  } else {
    action = { type: "add", amount: pickAmount(range, state, player, style, spot, pEv, emotion) };
  }

  const thinkMs = estimateThinkMs(style, spot, emotion, action);
  const thoughts = buildThoughtBeats(state, style, spot, emotion, action, thinkMs, range);
  return { action, thinkMs, thoughts, emotion, spot };
}

export function chooseBotAction(state: TableState): PlayerAction {
  return planBotTurn(state).action;
}

/** Human-like tank: snappy on obvious trash, thoughtful on borderline or high-stakes spots. */
export function botThinkMs(state: TableState): number {
  const player = currentPlayer(state);
  const style = styleForPersona(player?.personaId);
  const spot = evaluateSpot(state);
  const emotion: BotEmotion = player
    ? inferBotEmotion(state, player.id)
    : { winStreak: 0, loseStreak: 0, recentHorn: 0, sessionDelta: 0, handDelta: 0, heat: 0, tableDrama: null };
  return estimateThinkMs(style, spot, emotion);
}

function moodForOutcome(kind: OutcomeKind): BubbleMood {
  if (kind === "win" || kind === "triple_win") return "joy";
  if (kind === "horn") return "tilt";
  if (kind === "lose" || kind === "triple_lose") return "wary";
  return "calm";
}

/** Generate 0-2 restrained, lifelike post-reveal reactions (actor + at most 1 spectator). */
export function planTableReactions(state: TableState): TableReaction[] {
  if (state.phase !== "reveal" || !state.outcome) return [];
  const actor = currentPlayer(state);
  if (!actor) return [];

  const outcome = state.outcome;
  const kind = outcome.kind;
  const amount = outcome.amount;
  const reactions: TableReaction[] = [];

  // 1. Actor's own reaction (when actor is a bot)
  if (actor.kind === "bot") {
    const persona = personaById(actor.personaId ?? "");
    const style = persona?.style ?? styleForPersona(actor.personaId);
    const v = style.voices;
    let chance = 0;
    let pool: readonly string[] = [];

    if (kind === "triple_win") {
      chance = 1;
      pool = v.onTripleWin;
    } else if (kind === "horn") {
      chance = outcome.multiplier === 4 ? 0.96 : 0.72 + style.talkativeness * 0.22;
      pool = v.onHorn;
    } else if (kind === "win") {
      const big = amount >= 40_000 || state.projectPool === 0;
      chance = big ? 0.65 + style.talkativeness * 0.25 : 0.28 + style.talkativeness * 0.28;
      pool = big ? v.onBigWin : v.onWin;
    } else if (kind === "lose" || kind === "triple_lose") {
      const big = amount >= 35_000;
      chance = big ? 0.5 + style.talkativeness * 0.3 : 0.18 + style.talkativeness * 0.2;
      pool = v.onLose;
    } else if (kind === "consecutive") {
      chance = 0.22 + style.talkativeness * 0.26;
      pool = v.onConsecutive;
    }

    if (pool.length > 0 && Math.random() < chance) {
      reactions.push({
        playerId: actor.id,
        text: pick(pool),
        delayMs: 120,
        mood: moodForOutcome(kind),
      });
    }
  }

  // 2. At most ONE spectator bot comments on notable moments (including human plays!)
  const spectators = state.players.filter((p) => p.kind === "bot" && p.id !== actor.id && p.inHand);
  if (spectators.length === 0) return reactions;

  const isSuperHorn = kind === "horn" && outcome.multiplier === 4;
  const isBigHorn = kind === "horn" && amount >= 30_000;
  const isTriple = kind === "triple_win";
  const isBigWin = kind === "win" && (amount >= 55_000 || state.projectPool === 0);
  const poolJustFattened =
    (kind === "horn" || kind === "lose") &&
    amount >= 40_000 &&
    state.projectPool >= state.config.ante * state.players.length * 1.45;

  let specChance = 0;
  let category: "horn" | "triple" | "bigWin" | "fatPool" | null = null;

  if (isTriple) {
    specChance = 0.85;
    category = "triple";
  } else if (isSuperHorn) {
    specChance = 0.82;
    category = "horn";
  } else if (isBigHorn) {
    specChance = 0.55;
    category = "horn";
  } else if (isBigWin) {
    specChance = actor.kind === "human" ? 0.68 : 0.45;
    category = "bigWin";
  } else if (poolJustFattened) {
    specChance = 0.38;
    category = "fatPool";
  }

  if (category && Math.random() < specChance) {
    // Weight spectator selection by talkativeness so livelier bots chime in more naturally.
    const weighted = spectators.map((p) => ({
      player: p,
      weight: 0.25 + styleForPersona(p.personaId).talkativeness,
    }));
    const totalW = weighted.reduce((sum, x) => sum + x.weight, 0);
    let r = Math.random() * totalW;
    let chosen = weighted[0]!.player;
    for (const item of weighted) {
      r -= item.weight;
      if (r <= 0) {
        chosen = item.player;
        break;
      }
    }
    const v = styleForPersona(chosen.personaId).voices;
    const bank =
      category === "triple"
        ? v.reactTriple
        : category === "horn"
          ? v.reactHorn
          : category === "bigWin"
            ? v.reactBigWin
            : v.reactFatPool;
    reactions.push({
      playerId: chosen.id,
      text: pick(bank),
      delayMs: reactions.length > 0 ? 480 : 240,
      mood: category === "horn" ? "wary" : category === "fatPool" ? "bold" : "joy",
    });
  }

  return reactions;
}
