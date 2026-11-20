import { formatTokens, type PublicState } from "@hotpot/engine";
import { Avatar } from "./Avatar";

export function SettlementModal({
  state,
  you,
  mode,
  onContinue,
  onLeave,
}: {
  state: PublicState;
  you: string;
  mode?: "pve" | "pvp";
  onContinue: () => void;
  onLeave: () => void;
}) {
  const settlement = state.settlement;
  if (!settlement || (state.phase !== "settlement" && state.phase !== "gameover")) return null;

  const title =
    settlement.reason === "empty"
      ? "许愿池已清空"
      : settlement.reason === "split"
        ? `满 ${state.config.dealsUntilSplit} 发 · 摊池结算`
        : "本局结束";

  const sorted = [...state.players].sort(
    (a, b) => (settlement.deltas[b.id] ?? 0) - (settlement.deltas[a.id] ?? 0),
  );

  return (
    <div className="overlay">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="settle-title">
        <div className="modal-head">
          <h2 id="settle-title">{title}</h2>
          <p className="muted">
            第 {state.handNumber} 盘 · 池余 {formatTokens(settlement.leftoverPool)} Tokens
            {settlement.splitEach ? ` · 每人分得 ${formatTokens(settlement.splitEach)} Tokens` : ""}
          </p>
        </div>

        <ul className="delta-list">
          {sorted.map((p) => {
            const d = settlement.deltas[p.id] ?? 0;
            return (
              <li key={p.id} className={p.id === you ? "me" : ""}>
                <div className="delta-player">
                  <Avatar name={p.name} personaId={p.personaId} you={p.id === you} size="sm" />
                  <div>
                    <div className="delta-name">
                      {p.name}
                      {p.id === you ? <span className="tag you-tag">你</span> : null}
                    </div>
                    <small className="muted">余额 {formatTokens(p.tokens)} Tokens</small>
                  </div>
                </div>
                <b className={`delta-val ${d > 0 ? "up" : d < 0 ? "down" : "flat"}`}>
                  {d > 0 ? "+" : ""}
                  {formatTokens(d)}
                  <small> Tokens</small>
                </b>
              </li>
            );
          })}
        </ul>

        {mode === "pvp" ? (
          <p className="muted settle-note">返回大厅后本局立即结束，房间回到等待状态。</p>
        ) : null}

        <div className="row">
          {state.phase === "gameover" ? (
            <button className="btn primary" onClick={onLeave}>
              返回大厅
            </button>
          ) : (
            <>
              <button className="btn ghost" onClick={onLeave}>
                返回大厅
              </button>
              <button className="btn primary" onClick={onContinue}>
                继续下一盘
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
