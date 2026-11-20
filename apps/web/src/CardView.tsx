import { cardKey, isRed, rankLabel, type Card, type OutcomeKind } from "@hotpot/engine";

export function SuitIcon({ suit, className = "suit" }: { suit: Card["suit"]; className?: string }) {
  if (suit === "clubs") {
    return (
      <svg viewBox="0 0 32 32" className={className} aria-hidden>
        <circle cx="16" cy="10.2" r="5.3" fill="currentColor" />
        <circle cx="10.4" cy="18" r="5.3" fill="currentColor" />
        <circle cx="21.6" cy="18" r="5.3" fill="currentColor" />
        <rect x="13" y="13" width="6" height="6" fill="currentColor" />
        <path d="M16 17.5 L12.4 28.5 H19.6 Z" fill="currentColor" />
      </svg>
    );
  }
  if (suit === "spades") {
    return (
      <svg viewBox="0 0 32 32" className={className} aria-hidden>
        <path
          d="M16 3.5 C12.5 9.2 5.5 13.8 5.5 19.2 A5.5 5.5 0 0 0 14.8 22.8 L12.4 28.5 H19.6 L17.2 22.8 A5.5 5.5 0 0 0 26.5 19.2 C26.5 13.8 19.5 9.2 16 3.5 Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (suit === "hearts") {
    return (
      <svg viewBox="0 0 32 32" className={className} aria-hidden>
        <path
          d="M16 28 C16 28 5 20.4 5 12.2 A5.8 5.8 0 0 1 16 9.4 A5.8 5.8 0 0 1 27 12.2 C27 20.4 16 28 16 28 Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M16 3.5 Q20 12 27.5 16 Q20 20 16 28.5 Q12 20 4.5 16 Q12 12 16 3.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CardFace({
  card,
  compact,
  tone,
}: {
  card: Card;
  compact?: boolean;
  tone?: string;
}) {
  const red = isRed(card.suit);
  const royal = card.rank === 1 || card.rank >= 11;
  return (
    <div
      className={`card-face ${red ? "red" : "black"} ${compact ? "compact" : ""} ${royal ? "royal" : ""} ${tone ? `tone-${tone}` : ""}`}
    >
      <div className="corner top-left">
        <b>{rankLabel(card.rank)}</b>
        <SuitIcon suit={card.suit} />
      </div>
      <div className="center-pip">
        <SuitIcon suit={card.suit} />
      </div>
      {!compact ? (
        <div className="corner bottom-right" aria-hidden>
          <b>{rankLabel(card.rank)}</b>
          <SuitIcon suit={card.suit} />
        </div>
      ) : null}
    </div>
  );
}

export function CardBack({ pending = false }: { pending?: boolean }) {
  return (
    <div className={`card-back-face ${pending ? "pending" : ""}`} aria-hidden>
      <div className="card-back-frame">
        <div className="card-back-emblem" />
      </div>
    </div>
  );
}

export function CardView({
  card,
  tilt = 0,
  compact,
  draw = false,
  delayMs = 0,
}: {
  card: Card;
  tilt?: number;
  compact?: boolean;
  draw?: boolean;
  delayMs?: number;
}) {
  return (
    <div
      key={cardKey(card)}
      className={`playing-card ${compact ? "compact" : ""} ${draw ? "draw" : ""}`}
      style={{ ["--tilt" as string]: `${tilt}deg`, ["--draw-delay" as string]: `${delayMs}ms` }}
    >
      <CardFace card={card} compact={compact} />
    </div>
  );
}

function outcomeTone(kind: OutcomeKind | undefined): string {
  if (!kind) return "";
  if (kind === "win") return "win";
  if (kind === "triple_win") return "triple";
  if (kind === "horn") return "horn";
  if (kind === "lose" || kind === "triple_lose") return "lose";
  return "";
}

export function ThirdCardSlot({
  card,
  revealed,
  pending,
  highlight,
  outcomeKind,
}: {
  card: Card | null;
  revealed: boolean;
  pending: boolean;
  highlight: boolean;
  outcomeKind?: OutcomeKind;
}) {
  const flipped = Boolean(revealed && card);
  const tone = highlight ? outcomeTone(outcomeKind) : "";

  return (
    <div
      className={`third-slot ${flipped ? "flipped" : ""} ${pending ? "pending" : ""} ${tone ? `result-${tone}` : ""}`}
    >
      <div className="third-inner">
        <div className="third-side third-back">
          <CardBack pending={pending} />
        </div>
        <div className="third-side third-front">
          {card ? <CardFace card={card} tone={tone} /> : null}
        </div>
      </div>
    </div>
  );
}
