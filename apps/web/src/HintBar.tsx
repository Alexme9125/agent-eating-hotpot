import { isAceKing, rankLabel, type Card, type HoleHint, type OutcomeKind, type Rank } from "@hotpot/engine";

const ALL_RANKS: readonly Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export function HintBar({
  hint,
  hole,
  third,
  showThird,
  outcomeKind,
}: {
  hint: HoleHint | null;
  hole?: [Card, Card] | null;
  third?: Card | null;
  showThird?: boolean;
  outcomeKind?: OutcomeKind;
}) {
  if (!hint) return null;

  if (hint.kind === "consecutive") {
    return (
      <div className="hint-strip consecutive">
        <span>连张无区间 · 自动过牌</span>
      </div>
    );
  }

  const winSet = new Set(hint.winRanks);
  const hornSet = new Set(hint.hornRanks);
  const ak = Boolean(hole && isAceKing(hole[0], hole[1]));
  const landedRank = showThird && third ? third.rank : null;

  const summary =
    hint.kind === "pair"
      ? `对 ${rankLabel(hint.hornRanks[0]!)} · 再出同点通吃全池`
      : ak
        ? `赢 ${hint.winRanks.length} 档 · 超级牛角尖 ×4`
        : `赢 ${hint.winRanks.length} 档 · 牛角尖 ×2`;

  return (
    <div className="hint-ruler" aria-label={summary}>
      <div className="ruler-track">
        {ALL_RANKS.map((r) => {
          const isPairTarget = hint.kind === "pair" && hornSet.has(r);
          const isWin = winSet.has(r);
          const isHorn = hint.kind === "spread" && hornSet.has(r);
          const isLanded = landedRank === r;
          const cls = [
            "ruler-cell",
            isPairTarget ? "is-pair" : "",
            isWin ? "is-win" : "",
            isHorn ? "is-horn" : "",
            isLanded ? "is-landed" : "",
            isLanded && outcomeKind ? `landed-${outcomeKind}` : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <span key={r} className={cls}>
              {rankLabel(r)}
            </span>
          );
        })}
      </div>
      <div className="ruler-caption">{summary}</div>
    </div>
  );
}
