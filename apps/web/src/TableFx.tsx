import { formatTokens, type PublicState, type RevealFxStage, type RevealOutcome } from "@hotpot/engine";
import { useEffect, useRef, useState } from "react";
import { playFlip, playOutcome, playWager } from "./sound";

interface TokenChip {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  delay: number;
  variant: "jade" | "gold" | "crimson";
}

interface Stamp {
  id: number;
  text: string;
  sub?: string;
  x: number;
  y: number;
  tone: string;
}

function centerOf(el: Element, root: DOMRect): { x: number; y: number } {
  const box = el.getBoundingClientRect();
  return { x: box.left + box.width / 2 - root.left, y: box.top + box.height / 2 - root.top };
}

function stampFor(outcome: RevealOutcome): { text: string; sub?: string; tone: string } | null {
  if (outcome.kind === "win") {
    return { text: "爽吃", sub: `+${formatTokens(outcome.amount)}`, tone: "win" };
  }
  if (outcome.kind === "triple_win") {
    return { text: "三张通吃", sub: `+${formatTokens(outcome.amount)}`, tone: "triple" };
  }
  if (outcome.kind === "lose" || outcome.kind === "triple_lose") {
    return { text: "挨饿", sub: `-${formatTokens(outcome.amount)}`, tone: "lose" };
  }
  if (outcome.kind === "consecutive") {
    return { text: "连张过牌", tone: "skip" };
  }
  if (outcome.kind === "horn") {
    return outcome.multiplier === 4
      ? { text: "超级牛角尖 ×4", sub: `-${formatTokens(outcome.amount)}`, tone: "super" }
      : { text: "牛角尖 ×2", sub: `-${formatTokens(outcome.amount)}`, tone: "horn" };
  }
  return null;
}

function chipCount(amount: number): number {
  return Math.min(7, Math.max(3, Math.round(amount / 15_000)));
}

export function TableFx({
  state,
  stage,
}: {
  state: PublicState | null;
  stage: RevealFxStage;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);
  const fired = useRef("");
  const [chips, setChips] = useState<TokenChip[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);

  const outcomeKey = state
    ? `${state.handNumber}-${state.dealsThisHand}-${state.currentPlayerId}-${state.phase}-${state.outcome?.kind ?? ""}-${state.outcome?.amount ?? 0}`
    : "";
  const handKey = state ? `hand-${state.handNumber}` : "";

  function fly(
    fromEl: Element | null,
    toEl: Element | null,
    count: number,
    variant: TokenChip["variant"] = "jade",
  ) {
    const host = hostRef.current;
    if (!host || !fromEl || !toEl) return;
    const root = host.getBoundingClientRect();
    const from = centerOf(fromEl, root);
    const to = centerOf(toEl, root);
    const next: TokenChip[] = [];
    for (let i = 0; i < count; i++) {
      seq.current += 1;
      const jitter = (n: number) => n + (Math.random() - 0.5) * 16;
      next.push({
        id: seq.current,
        x: jitter(from.x),
        y: jitter(from.y),
        dx: to.x - from.x + (Math.random() - 0.5) * 20,
        dy: to.y - from.y + (Math.random() - 0.5) * 14,
        delay: i * 48,
        variant,
      });
    }
    setChips((prev) => [...prev, ...next]);
    window.setTimeout(() => {
      setChips((prev) => prev.filter((b) => !next.some((n) => n.id === b.id)));
    }, 880 + count * 48);
  }

  function shout(playerEl: Element | null, text: string, tone: string, sub?: string) {
    const host = hostRef.current;
    if (!host || !playerEl) return;
    const root = host.getBoundingClientRect();
    const at = centerOf(playerEl, root);
    seq.current += 1;
    const item: Stamp = { id: seq.current, text, sub, x: at.x, y: at.y - 34, tone };
    setStamps((prev) => [...prev, item]);
    window.setTimeout(() => {
      setStamps((prev) => prev.filter((s) => s.id !== item.id));
    }, 1750);
  }

  useEffect(() => {
    if (!state || state.handNumber < 1) return;
    const host = hostRef.current;
    if (!host) return;
    const pool = host.parentElement?.querySelector("[data-pool]");
    const seats = host.parentElement?.querySelectorAll("[data-player-id]");
    if (!pool || !seats?.length) return;
    shout(pool, `底注 ${formatTokens(state.config.ante)}`, "ante");
    seats.forEach((seat, i) => {
      window.setTimeout(() => fly(seat, pool, 3, "gold"), i * 85);
    });
    // Only on new hand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handKey]);

  useEffect(() => {
    const fireKey = `${outcomeKey}:${stage}`;
    if (!state?.outcome || !state.currentPlayerId || !fireKey || fired.current === fireKey) return;
    fired.current = fireKey;

    const host = hostRef.current;
    if (!host) return;
    const root = host.parentElement;
    const pool = root?.querySelector("[data-pool]") ?? null;
    const seat = root?.querySelector(`[data-player-id="${state.currentPlayerId}"]`) ?? null;
    const outcome = state.outcome;
    const wager = outcome.wager ?? 0;
    const kind = outcome.kind;

    if (stage === "wager" && wager > 0) {
      fly(seat, pool, chipCount(wager), "jade");
      playWager();
      return;
    }

    if (stage === "flip") {
      playFlip();
      return;
    }

    if (stage === "result") {
      const stamp = stampFor(outcome);
      if (stamp) shout(seat, stamp.text, stamp.tone, stamp.sub);
      if (kind !== "fold" && kind !== "consecutive") playOutcome(kind);
      return;
    }

    if (stage === "payout") {
      if (kind === "win" || kind === "triple_win") {
        fly(
          pool,
          seat,
          kind === "triple_win" ? 9 : chipCount(wager + outcome.amount),
          kind === "triple_win" ? "gold" : "jade",
        );
      } else if (kind === "horn") {
        const extra = outcome.amount - wager;
        if (extra > 0) fly(seat, pool, chipCount(extra), "crimson");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, outcomeKey]);

  return (
    <div className="fx-layer" ref={hostRef} aria-hidden>
      {chips.map((chip) => (
        <span
          key={chip.id}
          className={`chip-token chip-${chip.variant}`}
          style={{
            left: chip.x,
            top: chip.y,
            ["--dx" as string]: `${chip.dx}px`,
            ["--dy" as string]: `${chip.dy}px`,
            ["--delay" as string]: `${chip.delay}ms`,
          }}
        />
      ))}
      {stamps.map((item) => (
        <div
          key={item.id}
          className={`outcome-stamp tone-${item.tone}`}
          style={{ left: item.x, top: item.y }}
        >
          <span>{item.text}</span>
          {item.sub ? <em>{item.sub}</em> : null}
        </div>
      ))}
    </div>
  );
}
