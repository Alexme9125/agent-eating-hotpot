import { useEffect } from "react";

export function RulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2 id="rules-title">吃火锅玩法</h2>
            <p className="muted">四人桌，52 张牌（A 最小，K 最大），中央的「许愿池」是大家投入的 Tokens。</p>
          </div>
        </div>

        <div className="rule-grid">
          <div className="rule-item">
            <b>底注与亮牌</b>
            <p>开盘每人投 50K Tokens 入许愿池（起始 500K Tokens）。轮到谁，全桌亮出他的两张底牌（上家的牌保留对照）。</p>
          </div>
          <div className="rule-item">
            <b>夹中爽吃</b>
            <p>选择放弃，或向许愿池添菜后再翻第三张。落在两底牌点数之间，从池中赢回等额 Tokens；落出区间则留在池里。</p>
          </div>
          <div className="rule-item">
            <b>牛角尖加倍</b>
            <p>第三张与任一张底牌同点即为牛角尖，扣 2 倍；若底牌是 A + K 为超级牛角尖，扣 4 倍（单次封顶 200K Tokens）。</p>
          </div>
          <div className="rule-item">
            <b>对子与连张</b>
            <p>两张连张自动过牌（A 与 K 不算连张）。两张同点只可下 5K Tokens 最小添菜，再开同点直接通吃整个许愿池。</p>
          </div>
          <div className="rule-item">
            <b>清池与摊池</b>
            <p>许愿池被赢空本盘立即结算；若满 24 次发牌仍未清空，池中一半 Tokens 由在座玩家平分。</p>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn primary" onClick={onClose}>
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
