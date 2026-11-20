import { betPresets, formatTokens, type BetRange } from "@hotpot/engine";
import { useEffect, useState } from "react";

export function ActionBar({
  range,
  pool,
  specialNote,
  disabled,
  onFold,
  onAdd,
}: {
  range: BetRange | null;
  pool: number;
  specialNote?: string | null;
  disabled: boolean;
  onFold: () => void;
  onAdd: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(range?.min ?? 0);
  useEffect(() => {
    if (range) setAmount(range.min);
  }, [range?.min, range?.max, range?.locked]);

  if (!range) {
    return (
      <div className="action-bar">
        <button className="btn ghost" disabled={disabled} onClick={onFold}>
          放弃
        </button>
      </div>
    );
  }

  const presets = betPresets(range).map((preset) =>
    preset.amount === range.max && pool === range.max
      ? { ...preset, label: "清池" }
      : preset,
  );
  const span = Math.max(1, range.max - range.min);
  const pct = range.locked ? 100 : Math.round(((amount - range.min) / span) * 100);

  return (
    <div className="action-deck">
      {specialNote ? <div className="action-note">{specialNote}</div> : null}
      <div className="action-bar">
        <button className="btn ghost fold-btn" disabled={disabled} onClick={onFold}>
          放弃
        </button>

        <div className="bet-controls">
          {presets.length > 0 ? (
            <div className="preset-row" role="group" aria-label="快捷 Tokens">
              {presets.map((p) => (
                <button
                  key={p.amount}
                  type="button"
                  className={`preset-btn ${amount === p.amount ? "selected" : ""}`}
                  disabled={disabled}
                  aria-pressed={amount === p.amount}
                  onClick={() => setAmount(p.amount)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="slider-wrap">
            <input
              type="range"
              min={range.min}
              max={range.max}
              step={1000}
              value={amount}
              disabled={disabled || range.locked}
              style={{ ["--pct" as string]: `${pct}%` }}
              onChange={(e) => setAmount(Number(e.target.value))}
              aria-label="添菜 Tokens"
            />
            <b className="stake-readout">
              {formatTokens(amount)}
              <small> Tokens</small>
            </b>
          </div>
        </div>

        <button className="btn primary add-btn" disabled={disabled} onClick={() => onAdd(amount)}>
          {range.locked ? `最小添菜 ${formatTokens(amount)}` : `添菜 ${formatTokens(amount)}`}
        </button>
      </div>
    </div>
  );
}
