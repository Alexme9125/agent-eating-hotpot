import { DEFAULT_CONFIG, formatTokens, type Card } from "@hotpot/engine";
import { useState } from "react";
import { CardBack, CardView } from "./CardView";

const SHOWCASE_LEFT: Card = { rank: 3, suit: "spades" };
const SHOWCASE_RIGHT: Card = { rank: 12, suit: "hearts" };

export function Lobby({
  name,
  onName,
  busy,
  error,
  onPve,
  onCreatePvp,
  onJoin,
  onOpenRules,
}: {
  name: string;
  onName: (v: string) => void;
  busy: boolean;
  error: string;
  onPve: () => void;
  onCreatePvp: () => void;
  onJoin: (code: string) => void;
  onOpenRules: () => void;
}) {
  const [code, setCode] = useState("");

  return (
    <div className="lobby">
      <div className="lobby-shell">
        <header className="lobby-hero">
          <div className="lobby-emblem" aria-hidden>
            <div className="emblem-felt">
              <CardView card={SHOWCASE_LEFT} tilt={-9} />
              <div className="emblem-mid">
                <CardBack />
              </div>
              <CardView card={SHOWCASE_RIGHT} tilt={9} />
            </div>
          </div>
          <h1>吃火锅</h1>
          <p className="lede">
            把 Tokens 投进许愿池。
            <br />
            第三张落入区间即赢，撞尖加倍，三张通吃。
          </p>
        </header>

        <section className="panel">
          <label className="field">
            <span>你的昵称</span>
            <input
              value={name}
              maxLength={16}
              onChange={(e) => onName(e.target.value)}
              placeholder="输入牌桌显示名称"
            />
          </label>

          {error ? <p className="error">{error}</p> : null}

          <button className="btn primary lg" disabled={busy} onClick={onPve}>
            开始人机对局
          </button>

          <div className="divider">
            <span>或与好友同桌</span>
          </div>

          <div className="pvp-row">
            <button className="btn ghost" disabled={busy} onClick={onCreatePvp}>
              创建房间
            </button>
            <div className="join">
              <input
                value={code}
                maxLength={6}
                placeholder="输入房间码"
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !busy && code.length >= 4) onJoin(code);
                }}
              />
              <button
                className="btn subtle"
                disabled={busy || code.length < 4}
                onClick={() => onJoin(code)}
              >
                加入
              </button>
            </div>
          </div>
        </section>

        <footer className="lobby-foot">
          <span>
            四人桌 · 底注 {formatTokens(DEFAULT_CONFIG.ante)} Tokens · 最小添菜{" "}
            {formatTokens(DEFAULT_CONFIG.minAdd)} Tokens · {DEFAULT_CONFIG.dealsUntilSplit} 发摊池
          </span>
          <button type="button" className="link" onClick={onOpenRules}>
            玩法规则
          </button>
        </footer>
      </div>
    </div>
  );
}
