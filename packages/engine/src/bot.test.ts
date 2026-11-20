import { describe, expect, it } from "vitest";
import { makeDeck } from "./cards.js";
import {
  applyAction,
  botThinkMs,
  chooseBotAction,
  computeBetRange,
  createTable,
  DEFAULT_CONFIG,
  evaluateSpot,
  forceAwaiting,
  inferBotEmotion,
  planBotTurn,
  planTableReactions,
  styleForPersona,
} from "./index.js";
import type { Card, Player, Rank, Suit, TableState } from "./types.js";

const c = (rank: Rank, suit: Suit = "spades"): Card => ({ rank, suit });

function fourBots(): Pick<Player, "id" | "name" | "kind" | "personaId">[] {
  return [
    { id: "p1", name: "Bot", kind: "bot", personaId: "claude" },
    { id: "p2", name: "B2", kind: "bot", personaId: "gpt" },
    { id: "p3", name: "B3", kind: "bot", personaId: "gemini" },
    { id: "p4", name: "B4", kind: "bot", personaId: "deepseek" },
  ];
}

function sameRank(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

function leftoverDeck(hole: [Card, Card]): Card[] {
  return makeDeck().filter((card) => !hole.some((h) => sameRank(h, card)));
}

function awaitingWith(
  personaId: string,
  hole: [Card, Card],
  pool = 200_000,
): TableState {
  const players = fourBots();
  players[0] = { ...players[0]!, personaId, name: personaId };
  const table = createTable(players, { ...DEFAULT_CONFIG }, 11);
  table.projectPool = pool;
  for (const p of table.players) {
    p.inHand = true;
    p.tokens = DEFAULT_CONFIG.startingTokens - DEFAULT_CONFIG.ante;
  }
  return forceAwaiting(table, 0, hole, leftoverDeck(hole));
}

function foldRate(personaId: string, hole: [Card, Card], n = 64): number {
  let folds = 0;
  for (let i = 0; i < n; i++) {
    const action = chooseBotAction(awaitingWith(personaId, hole));
    if (action.type === "fold") folds += 1;
  }
  return folds / n;
}

function addAmounts(personaId: string, hole: [Card, Card], n = 48): number[] {
  const amounts: number[] = [];
  for (let i = 0; i < n; i++) {
    const action = chooseBotAction(awaitingWith(personaId, hole));
    if (action.type === "add") amounts.push(action.amount);
  }
  return amounts;
}

function average(values: number[]): number {
  expect(values.length).toBeGreaterThan(8);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

describe("bot personas", () => {
  it("treats a 3-J spread as roughly break-even", () => {
    const spot = evaluateSpot(awaitingWith("gpt", [c(3), c(11)]));
    expect(spot?.kind).toBe("spread");
    expect(spot?.unitEv ?? 99).toBeCloseTo(0, 1);
    expect(spot?.pWin ?? 0).toBeGreaterThan(0.5);
  });

  it("usually plays a medium 3-J instead of folding it", () => {
    const hole: [Card, Card] = [c(3), c(11)];
    expect(foldRate("claude", hole)).toBeLessThan(0.22);
    expect(foldRate("kimi", hole)).toBeLessThan(0.28);
    expect(foldRate("deepseek", hole)).toBeLessThan(0.12);
  });

  it("on a medium-low 4-10, prefers a small add over folding, and cautious stays smaller", () => {
    const hole: [Card, Card] = [c(4), c(10)];
    const claudeFold = foldRate("claude", hole);
    const deepFold = foldRate("deepseek", hole);
    expect(claudeFold).toBeLessThan(0.5);
    expect(deepFold).toBeLessThan(0.2);
    expect(claudeFold).toBeGreaterThan(deepFold);

    const claude = average(addAmounts("claude", hole));
    const deep = average(addAmounts("deepseek", hole));
    expect(claude).toBeLessThan(deep);
    expect(claude).toBeLessThan(40_000);
  });

  it("still folds a trash A-4 most of the time", () => {
    const hole: [Card, Card] = [c(1), c(4)];
    expect(foldRate("claude", hole)).toBeGreaterThan(0.85);
    expect(foldRate("deepseek", hole)).toBeGreaterThan(0.7);
  });

  it("sizes a medium-high 4-K larger for aggressive bots", () => {
    const hole: [Card, Card] = [c(4), c(13)];
    expect(average(addAmounts("claude", hole))).toBeLessThan(average(addAmounts("deepseek", hole)));
    expect(average(addAmounts("gemini", hole))).toBeGreaterThan(average(addAmounts("gpt", hole)));
  });

  it("lets aggressive bots shove the legal max more often on a fat A-K", () => {
    const hole: [Card, Card] = [c(1), c(13)];
    const range = computeBetRange(awaitingWith("deepseek", hole));
    expect(range?.max).toBe(DEFAULT_CONFIG.maxAdd);

    const rate = (id: string) => {
      const amounts = addAmounts(id, hole, 72);
      return amounts.filter((n) => n === range!.max).length / amounts.length;
    };
    const claude = rate("claude");
    const deepseek = rate("deepseek");
    expect(deepseek).toBeGreaterThan(0.25);
    expect(deepseek).toBeGreaterThan(claude);
    expect(average(addAmounts("claude", hole))).toBeLessThan(average(addAmounts("deepseek", hole)));
  });

  it("still only posts the locked min add on a pair, even when aggressive", () => {
    const hole: [Card, Card] = [c(7, "spades"), c(7, "hearts")];
    for (let i = 0; i < 24; i++) {
      const action = chooseBotAction(awaitingWith("deepseek", hole));
      if (action.type === "add") {
        expect(action.amount).toBe(DEFAULT_CONFIG.minAdd);
      }
    }
  });

  it("tanks at least a few seconds so the table can see them think", () => {
    const state = awaitingWith("gemini", [c(3), c(11)]);
    for (let i = 0; i < 12; i++) {
      const ms = botThinkMs(state);
      expect(ms).toBeGreaterThanOrEqual(3_600);
      expect(ms).toBeLessThanOrEqual(12_000);
    }
    const cautious = styleForPersona("claude");
    const aggro = styleForPersona("deepseek");
    expect(cautious.foldBelow).toBeGreaterThan(aggro.foldBelow);
    expect(cautious.shove).toBeLessThan(aggro.shove);
    expect(aggro.sizeBias).toBeGreaterThan(cautious.sizeBias);
  });

  it("folds a dead pair when sharp bots see all matching ranks already exposed", () => {
    const hole: [Card, Card] = [c(7, "spades"), c(7, "hearts")];
    const deadDeck = leftoverDeck(hole).filter((card) => card.rank !== 7);
    const base = awaitingWith("gpt", hole, 300_000);
    base.deck = deadDeck;
    base.lastCards["p2"] = { hole: [c(7, "diamonds"), c(7, "clubs")] };
    const spot = evaluateSpot(base);
    expect(spot?.deadPair).toBe(true);
    for (let i = 0; i < 12; i++) {
      const plan = planBotTurn(base);
      expect(plan.action.type).toBe("fold");
      expect(plan.thoughts.length).toBeGreaterThan(0);
    }
  });

  it("tracks distinct emotional responses after a horn (tilt vs cool-down)", () => {
    const hot = awaitingWith("grok", [c(4), c(10)]);
    hot.logs.push({ id: 1, kind: "horn", playerId: "p1", name: "grok", amount: 40_000, text: "horn" });
    const cool = awaitingWith("kimi", [c(4), c(10)]);
    cool.logs.push({ id: 1, kind: "horn", playerId: "p1", name: "kimi", amount: 40_000, text: "horn" });

    const hotMood = inferBotEmotion(hot, "p1");
    const coolMood = inferBotEmotion(cool, "p1");
    expect(hotMood.recentHorn).toBe(2);
    expect(coolMood.recentHorn).toBe(2);
    expect(hotMood.heat).toBeGreaterThan(0.2);
    expect(coolMood.heat).toBeLessThan(-0.2);
  });

  it("plans faster glances on easy trash folds than contested 3-J decisions", () => {
    const trashSamples = Array.from({ length: 30 }, () => planBotTurn(awaitingWith("glm", [c(1), c(4)])).thinkMs);
    const closeSamples = Array.from({ length: 30 }, () => planBotTurn(awaitingWith("glm", [c(3), c(11)])).thinkMs);
    expect(average(trashSamples)).toBeLessThan(average(closeSamples));
  });

  it("produces coherent timed thoughts and restrained post-reveal reactions", () => {
    const state = awaitingWith("grok", [c(1), c(13)], 260_000);
    const plan = planBotTurn(state);
    expect(plan.thoughts.length).toBeGreaterThanOrEqual(1);
    for (const beat of plan.thoughts) {
      expect(beat.text.trim().length).toBeGreaterThan(0);
      expect(beat.atMs).toBeLessThan(plan.thinkMs);
    }

    const revealed = applyAction(
      forceAwaiting(state, 0, [c(7, "spades"), c(7, "hearts")], [c(7, "clubs")]),
      "p1",
      { type: "add", amount: DEFAULT_CONFIG.minAdd },
    );
    const reactions = planTableReactions(revealed);
    expect(reactions.length).toBeGreaterThanOrEqual(1);
    expect(reactions.length).toBeLessThanOrEqual(2);
    expect(reactions[0]!.playerId).toBe("p1");
  });

  it("supports Logan's calm-ambusher profile (folds trash, attacks fat pools, stays cool after horn)", () => {
    expect(foldRate("logan", [c(1), c(4)])).toBeGreaterThan(0.85);
    const fatGood = awaitingWith("logan", [c(2), c(13)], 320_000);
    const loganAvg = average(addAmounts("logan", [c(2), c(13)], 48));
    const aquaAvg = average(addAmounts("kimi", [c(2), c(13)], 48));
    expect(loganAvg).toBeGreaterThan(aquaAvg);

    fatGood.logs.push({ id: 1, kind: "horn", playerId: "p1", name: "Logan", amount: 40_000, text: "horn" });
    const mood = inferBotEmotion(fatGood, "p1");
    expect(mood.heat).toBeLessThan(0);
  });
});
