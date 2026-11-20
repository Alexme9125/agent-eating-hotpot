import {
  DEFAULT_CONFIG,
  formatTokens,
  holeKind,
  isAceKing,
  type PublicPlayer,
} from "@hotpot/engine";
import { useEffect, useState } from "react";
import { ActionBar } from "./ActionBar";
import { CardView, ThirdCardSlot } from "./CardView";
import { HintBar } from "./HintBar";
import { SeatCapsule } from "./SeatCapsule";
import { SettlementModal } from "./SettlementModal";
import { TableFx } from "./TableFx";
import type { RoomSnapshot } from "./api";
import { useRevealPlay } from "./revealPlay";
import { isSoundOn, setSoundOn, unlockSound } from "./sound";

const PLACES = ["bottom", "right", "top", "left"] as const;

function placeFor(viewerIndex: number, seatIndex: number, count: number): (typeof PLACES)[number] {
  const offset = (seatIndex - viewerIndex + count) % count;
  return PLACES[offset] ?? "bottom";
}

function previousPlayerId(players: PublicPlayer[], currentIndex: number): string | null {
  if (players.length === 0) return null;
  const n = players.length;
  for (let step = 1; step < n; step++) {
    const idx = (currentIndex - step + n) % n;
    const p = players[idx];
    if (p?.inHand) return p.id;
  }
  return null;
}

function PoolChipsIcon() {
  return (
    <svg className="pool-chips-svg" viewBox="0 0 36 32" aria-hidden>
      <ellipse cx="14" cy="22" rx="10" ry="5" fill="#C78C2B" />
      <ellipse cx="14" cy="20" rx="10" ry="5" fill="#E3B35A" />
      <ellipse cx="14" cy="20" rx="6.5" ry="3" fill="none" stroke="#FFF9EE" strokeWidth="1.2" strokeDasharray="3 2" />
      <ellipse cx="22" cy="17" rx="9.5" ry="4.8" fill="#14503D" />
      <ellipse cx="22" cy="15" rx="9.5" ry="4.8" fill="#1F765B" />
      <ellipse cx="22" cy="15" rx="6" ry="2.8" fill="none" stroke="#E8F6F0" strokeWidth="1.2" strokeDasharray="3 2" />
      <ellipse cx="17" cy="11.5" rx="9.5" ry="4.6" fill="#D4D8D2" />
      <ellipse cx="17" cy="9.5" rx="9.5" ry="4.6" fill="#F8F9F6" />
      <ellipse cx="17" cy="9.5" rx="6" ry="2.6" fill="none" stroke="#1B6B52" strokeWidth="1.2" strokeDasharray="3 2" />
    </svg>
  );
}

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="icon-sm" aria-hidden>
      <path
        d="M3.5 7.5 H6.8 L11 4 V16 L6.8 12.5 H3.5 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {on ? (
        <>
          <path d="M13.8 7.2 A3.8 3.8 0 0 1 13.8 12.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M16 5 A6.8 6.8 0 0 1 16 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
        </>
      ) : (
        <path d="M14 7.5 L18 12.5 M18 7.5 L14 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function TableView({
  room,
  now,
  error,
  onFold,
  onAdd,
  onContinue,
  onLeave,
  onFillBots,
  onOpenRules,
  onRename,
}: {
  room: RoomSnapshot;
  now: number;
  error?: string;
  onFold: () => void;
  onAdd: (amount: number) => void;
  onContinue: () => void;
  onLeave: () => void;
  onFillBots: () => void;
  onOpenRules: () => void;
  onRename: (name: string) => void;
}) {
  const state = room.state;
  const play = useRevealPlay(state, room.status);
  const seats = (play.players ??
    room.seats.map((s) => ({
      id: s.id,
      name: s.name,
      kind: s.kind,
      personaId: s.personaId,
      tokens: DEFAULT_CONFIG.startingTokens,
      inHand: true,
    }))) as PublicPlayer[];

  const youIndex = Math.max(0, seats.findIndex((p) => p.id === room.you));
  const remain = room.deadline ? Math.max(0, Math.ceil((room.deadline - now) / 1000)) : null;
  const yourTurn = Boolean(state && state.phase === "awaiting" && state.currentPlayerId === room.you);
  const currentKind = seats.find((p) => p.id === state?.currentPlayerId)?.kind;
  const showTurnClock = Boolean(
    remain !== null && state?.phase === "awaiting" && currentKind === "human",
  );
  const turnKey = `${state?.dealsThisHand}-${state?.currentPlayerId}-${state?.phase}`;
  const [lockedTurn, setLockedTurn] = useState("");
  const [sound, setSound] = useState(isSoundOn);
  const [logsOpen, setLogsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state?.phase !== "awaiting") setLockedTurn("");
  }, [state?.phase, turnKey]);

  const prevId = state ? previousPlayerId(seats, state.currentIndex) : null;
  const drawKey = `${state?.handNumber ?? 0}-${state?.dealsThisHand ?? 0}`;
  const maxDeals = state?.config.dealsUntilSplit ?? 24;
  const ante = state?.config.ante ?? DEFAULT_CONFIG.ante;
  const minAdd = state?.config.minAdd ?? DEFAULT_CONFIG.minAdd;
  const bubbles = room.bubbles ?? {};

  const showResultHighlight =
    play.stage === "result" || play.stage === "payout" || play.stage === "done";

  const specialNote = (() => {
    if (!yourTurn || !state?.hole) return null;
    if (holeKind(state.hole[0], state.hole[1]) === "pair") {
      return "对子仅可下最小添菜 · 再开同点通吃全池";
    }
    if (isAceKing(state.hole[0], state.hole[1])) {
      return "A 与 K 超级牛角尖 · 撞尖扣 4 倍（封顶 200K Tokens）";
    }
    return null;
  })();

  // Latest active bot utterance for narrow mobile screens where side speech bubbles are compact.
  const latestBubbleEntry = (() => {
    let best: { name: string; text: string; id: number; kind: "think" | "react" } | null = null;
    for (const p of seats) {
      const b = bubbles[p.id];
      if (b && (!best || b.id > best.id)) {
        best = { name: p.name, text: b.text, id: b.id, kind: b.kind };
      }
    }
    return best;
  })();

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="table-page">
      <header className="topbar">
        <div className="top-brand">
          <strong className="brand-mark">吃火锅</strong>
          <span className="stakes">
            底注 {formatTokens(ante)} / 最小 {formatTokens(minAdd)} Tokens
          </span>
          {error ? <span className="error">{error}</span> : null}
        </div>

        <div className="top-center">
          {state ? (
            <div className="hand-pill">
              <span>第 {state.handNumber} 盘</span>
              <span className="hand-sep" aria-hidden />
              <span className="deal-count">
                {state.dealsThisHand}/{maxDeals}
              </span>
              <span className="deal-meter" aria-hidden>
                <i style={{ width: `${Math.min(100, (state.dealsThisHand / maxDeals) * 100)}%` }} />
              </span>
            </div>
          ) : (
            <div className="hand-pill">等待入座</div>
          )}
        </div>

        <div className="top-right">
          {showTurnClock ? (
            <span className={`timer ${remain !== null && remain <= 8 ? "urgent" : ""}`}>
              {remain}s
            </span>
          ) : (
            <span className="status-text">{play.status}</span>
          )}
          <button
            className={`icon-btn ${sound ? "on" : "off"}`}
            type="button"
            aria-pressed={sound}
            title={sound ? "关闭音效" : "开启音效"}
            onClick={() => {
              const next = !sound;
              setSoundOn(next);
              setSound(next);
              if (next) void unlockSound();
            }}
          >
            <SoundIcon on={sound} />
            <span className="btn-label">{sound ? "音效" : "静音"}</span>
          </button>
          <button
            className={`text-btn ${logsOpen ? "active" : ""}`}
            type="button"
            aria-expanded={logsOpen}
            onClick={() => setLogsOpen((v) => !v)}
          >
            牌局
          </button>
          <button className="text-btn" type="button" onClick={onOpenRules}>
            规则
          </button>
          <button
            type="button"
            className="code-pill"
            title="点击复制房间码"
            onClick={() => void copyCode()}
          >
            {copied ? "已复制" : room.code}
          </button>
          <button className="text-btn leave-btn" type="button" onClick={onLeave}>
            离开
          </button>
        </div>
      </header>

      {logsOpen ? (
        <aside className="log-drawer" aria-label="牌局记录">
          <div className="log-drawer-head">
            <span>最近牌局</span>
            <button type="button" className="text-btn" onClick={() => setLogsOpen(false)}>
              收起
            </button>
          </div>
          <div className="log-drawer-list">
            {play.logs.length === 0 ? (
              <p className="muted">尚无记录</p>
            ) : (
              [...play.logs].reverse().map((line) => (
                <div key={line.id} className={`log-item kind-${line.kind}`}>
                  {line.text}
                </div>
              ))
            )}
          </div>
        </aside>
      ) : null}

      <main className="felt-wrap">
        <div
          className={`felt ${play.stage === "wager" ? "posting" : ""} ${play.stage === "payout" ? "paying" : ""}`}
        >
          <div className="felt-track" aria-hidden />

          <div className="board">
            <div className="pool" data-pool>
              <PoolChipsIcon />
              <div className="pool-meta">
                <small>许愿池</small>
                <b>
                  {formatTokens(play.pool)}
                  <span className="pool-unit"> Tokens</span>
                </b>
              </div>
            </div>

            {state?.hole ? (() => {
              const [leftHole, rightHole] =
                state.hole[0].rank <= state.hole[1].rank
                  ? [state.hole[0], state.hole[1]]
                  : [state.hole[1], state.hole[0]];
              return (
                <div className="board-cards" key={drawKey}>
                  <CardView card={leftHole} tilt={-3} draw delayMs={0} />
                  <ThirdCardSlot
                    card={state.third}
                    revealed={play.showThird}
                    pending={play.stage === "wager"}
                    highlight={showResultHighlight}
                    outcomeKind={state.outcome?.kind}
                  />
                  <CardView card={rightHole} tilt={3} draw delayMs={90} />
                </div>
              );
            })() : (
              <div className="waiting-copy">{room.started ? "正在洗牌发牌…" : "等待玩家入座"}</div>
            )}

            <HintBar
              hint={state?.hint ?? null}
              hole={state?.hole ?? null}
              third={state?.third ?? null}
              showThird={play.showThird}
              outcomeKind={showResultHighlight ? state?.outcome?.kind : undefined}
            />
          </div>

          {Array.from({ length: 4 }, (_, index) => {
            const player = seats[index];
            const place = placeFor(youIndex, index, 4);
            if (!player) {
              return (
                <div key={place} className={`seat seat-${place} empty`}>
                  <div className="capsule">
                    <span className="empty-dot" />
                    <span>等待入座</span>
                  </div>
                </div>
              );
            }
            const isCurrent = state?.currentPlayerId === player.id;
            const isPrev = prevId === player.id && prevId !== state?.currentPlayerId;
            const botThinking = Boolean(
              state?.phase === "awaiting" && isCurrent && player.kind === "bot",
            );
            return (
              <SeatCapsule
                key={player.id}
                player={player}
                you={player.id === room.you}
                active={Boolean(isCurrent)}
                thinking={botThinking}
                place={place}
                showCards={Boolean(player.cards && (isCurrent || isPrev))}
                bubble={bubbles[player.id] ?? null}
                renameable={room.mode === "pvp" && player.id === room.you}
                onRename={onRename}
              />
            );
          })}

          <TableFx state={state} stage={play.stage} />
        </div>
      </main>

      <footer className="bottom-dock">
        {yourTurn ? (
          <ActionBar
            range={state?.betRange ?? null}
            pool={play.pool}
            specialNote={specialNote}
            disabled={lockedTurn === turnKey}
            onFold={() => {
              setLockedTurn(turnKey);
              onFold();
            }}
            onAdd={(amount) => {
              setLockedTurn(turnKey);
              onAdd(amount);
            }}
          />
        ) : !room.started && room.hostId === room.you ? (
          <div className="wait-bar">
            <p className="muted">
              分享房间码 <b>{room.code}</b> 邀请好友，或直接补齐人机开局
              {room.mode === "pvp" ? "（点自己座位上的「改名」可换昵称）" : ""}
            </p>
            <button className="btn primary" onClick={onFillBots}>
              用人机开局
            </button>
          </div>
        ) : (
          <div className="feed-bar">
            {latestBubbleEntry ? (
              <span className="mobile-speech">
                <b>{latestBubbleEntry.name}</b>：{latestBubbleEntry.text}
              </span>
            ) : null}
            <p className="log-line">{play.logs.at(-1)?.text ?? play.status}</p>
          </div>
        )}
      </footer>

      {state ? (
        <SettlementModal
          state={state}
          you={room.you}
          mode={room.mode}
          onContinue={onContinue}
          onLeave={onLeave}
        />
      ) : null}
    </div>
  );
}
