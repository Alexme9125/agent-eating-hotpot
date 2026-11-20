import { formatTokens, type BetRange } from "@hotpot/engine";
import { useEffect, useState } from "react";

interface Preset {
  label: string;
  value: number;
}

function buildPresets(range: BetRange, pool: number): Preset[] {
  if (range.locked || range.max <= range.min) return [];
  const clamp = (v: number) => Math.min(range.max, Math.max(range.min, Math.round(v / 1000) * 1000));
  const halfRange = clamp(range.min + (range.max - range.min) / 2);
  const halfPool = clamp(Math.round(pool / 2 / 5000) * 5000);
  const mid = halfPool > range.min && halfPool < range.max ? halfPool : halfRange;
  const canClear = pool >= range.min && pool <= range.max;

  const raw: Preset[] = [
    { label: "最小", value: range.min },
    { label: mid === halfPool && halfPool !== halfRange ? "半池" : "一半", value: mid },
    { label: canClear ? "清池" : "打满", value: canClear ? clamp(pool) : range.max },
  ];

  const seen = new Set<number>();
  return raw.filter((item) => {
    if (seen.has(item.value)) return false;
    seen.add(item.value);
    return true;
  });
}

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

  const presets = buildPresets(range, pool);
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
                  key={p.label}
                  type="button"
                  className={`preset-btn ${amount === p.value ? "selected" : ""}`}
                  disabled={disabled}
                  onClick={() => setAmount(p.value)}
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
