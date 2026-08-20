import { betPresets, formatTokens, type BetRange } from "@hotpot/engine";
import { useEffect, useState } from "react";

export function ActionBar({
  range,
  disabled,
  onFold,
  onAdd,
}: {
  range: BetRange | null;
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

  const presets = betPresets(range);

  return (
    <div className="action-bar">
      <button className="btn ghost fold-btn" disabled={disabled} onClick={onFold}>
        放弃
      </button>
      {presets.length > 0 ? (
        <div className="bet-presets" role="group" aria-label="快捷添菜">
          {presets.map((preset) => (
            <button
              key={preset.amount}
              type="button"
              className={`bet-chip ${amount === preset.amount ? "on" : ""}`}
              disabled={disabled}
              aria-pressed={amount === preset.amount}
              onClick={() => setAmount(preset.amount)}
            >
              {preset.label}
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
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <b>{formatTokens(amount)}</b>
      </div>
      <button className="btn primary add-btn" disabled={disabled} onClick={() => onAdd(amount)}>
        {range.locked ? "最小添菜" : `添菜 ${formatTokens(amount)}`}
      </button>
    </div>
  );
}
