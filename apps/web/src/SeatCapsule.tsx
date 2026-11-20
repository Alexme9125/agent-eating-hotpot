import { formatTokens, type PublicPlayer, type SeatBubble } from "@hotpot/engine";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { CardView } from "./CardView";

export function SeatCapsule({
  player,
  you,
  active,
  thinking,
  place,
  showCards,
  bubble,
  renameable,
  onRename,
}: {
  player: PublicPlayer;
  you: boolean;
  active: boolean;
  thinking: boolean;
  place: "bottom" | "top" | "left" | "right";
  showCards: boolean;
  bubble?: SeatBubble | null;
  renameable?: boolean;
  onRename?: (name: string) => void;
}) {
  const cards = player.cards;
  const holeKey = cards
    ? `${cards.hole[0].suit}${cards.hole[0].rank}${cards.hole[1].suit}${cards.hole[1].rank}`
    : "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(player.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Subtle token change badge whenever this seat's visible stack changes.
  const prevTokensRef = useRef(player.tokens);
  const [delta, setDelta] = useState<{ id: number; amount: number } | null>(null);
  const deltaSeq = useRef(0);

  useEffect(() => {
    const diff = player.tokens - prevTokensRef.current;
    prevTokensRef.current = player.tokens;
    if (diff === 0) return;
    deltaSeq.current += 1;
    const id = deltaSeq.current;
    setDelta({ id, amount: diff });
    const t = window.setTimeout(() => {
      setDelta((cur) => (cur?.id === id ? null : cur));
    }, 1500);
    return () => window.clearTimeout(t);
  }, [player.tokens]);

  useEffect(() => {
    if (!editing) setDraft(player.name);
  }, [player.name, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit() {
    const next = draft.trim().slice(0, 16);
    setEditing(false);
    if (next && next !== player.name) onRename?.(next);
    else setDraft(player.name);
  }

  const showBubble = Boolean(bubble || thinking);
  const bubbleKind = bubble ? bubble.kind : "think";
  const bubbleMood = bubble?.mood ?? "calm";
  const bubbleKey = bubble ? `b-${bubble.id}` : thinking ? "thinking-wait" : "";

  return (
    <div
      className={`seat seat-${place} ${active ? "active" : ""} ${you ? "you" : ""} ${thinking ? "thinking" : ""} ${!player.inHand ? "out" : ""}`}
      data-player-id={player.id}
    >
      {showCards && cards ? (
        <div className="seat-cards" key={holeKey}>
          <CardView card={cards.hole[0]} tilt={-7} compact draw delayMs={0} />
          <CardView card={cards.hole[1]} tilt={7} compact draw delayMs={80} />
        </div>
      ) : null}

      {showBubble ? (
        <div
          key={bubbleKey}
          className={`seat-bubble kind-${bubbleKind} mood-${bubbleMood}`}
          aria-live="polite"
        >
          {bubble ? <span className="bubble-text">{bubble.text}</span> : null}
          {bubbleKind === "think" ? (
            <span className="dots" aria-hidden>
              <i />
              <i />
              <i />
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="capsule">
        <Avatar name={player.name} personaId={player.personaId} you={you} />
        <div className="capsule-meta">
          <div className="capsule-name">
            {editing ? (
              <input
                ref={inputRef}
                className="who-input"
                value={draft}
                maxLength={16}
                aria-label="改名"
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") {
                    setDraft(player.name);
                    setEditing(false);
                  }
                }}
              />
            ) : (
              <span className="who" title={player.name}>
                {player.name}
              </span>
            )}
            {you ? <span className="tag you-tag">你</span> : null}
            {renameable && !editing ? (
              <button
                type="button"
                className="rename-btn"
                onClick={() => {
                  setDraft(player.name);
                  setEditing(true);
                }}
              >
                改名
              </button>
            ) : null}
            {!player.inHand ? <span className="tag">旁观</span> : null}
          </div>
          <div className="capsule-tokens">
            <span className="token-val">
              {formatTokens(player.tokens)}
              <span className="token-unit"> Tokens</span>
            </span>
            {delta ? (
              <span
                key={delta.id}
                className={`token-delta ${delta.amount > 0 ? "up" : "down"}`}
              >
                {delta.amount > 0 ? "+" : ""}
                {formatTokens(delta.amount)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
