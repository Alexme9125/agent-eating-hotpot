import type { OutcomeKind } from "@hotpot/engine";

const SOUND_KEY = "hotpot.sound";

let ctx: AudioContext | null = null;
let enabled = true;

function readEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "0";
  } catch {
    return true;
  }
}

enabled = typeof localStorage === "undefined" ? true : readEnabled();

export function isSoundOn(): boolean {
  return enabled;
}

export function setSoundOn(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem(SOUND_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (on) void unlockSound();
}

export async function unlockSound(): Promise<void> {
  if (typeof window === "undefined") return;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* autoplay still blocked */
    }
  }
}

function tone(
  freq: number,
  when: number,
  dur: number,
  type: OscillatorType,
  gain: number,
  slideTo?: number,
  cutoff = 3600,
): void {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), when + dur);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(cutoff, when);
  amp.gain.setValueAtTime(0.0001, when);
  amp.gain.exponentialRampToValueAtTime(gain, when + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + dur + 0.03);
}

function paperSnap(when: number, gain = 0.045): void {
  if (!ctx) return;
  const len = Math.floor(ctx.sampleRate * 0.055);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const env = Math.exp(-i / (len * 0.24));
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1750, when);
  filter.Q.setValueAtTime(1.1, when);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, when);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  src.start(when);
}

export function playFlip(): void {
  if (!enabled) return;
  void (async () => {
    await unlockSound();
    if (!enabled || !ctx || ctx.state !== "running") return;
    const t = ctx.currentTime + 0.01;
    paperSnap(t, 0.055);
    tone(420, t, 0.04, "sine", 0.02, 260, 1400);
  })();
}

export function playWager(): void {
  if (!enabled) return;
  void (async () => {
    await unlockSound();
    if (!enabled || !ctx || ctx.state !== "running") return;
    const t = ctx.currentTime + 0.01;
    // Ceramic chip double clink
    tone(1480, t, 0.038, "triangle", 0.038, 1220, 3200);
    tone(1120, t + 0.042, 0.052, "sine", 0.032, 900, 2600);
  })();
}

export function playOutcome(kind: OutcomeKind): void {
  if (!enabled) return;
  void (async () => {
    await unlockSound();
    if (!enabled || !ctx || ctx.state !== "running") return;
    const t = ctx.currentTime + 0.02;
    if (kind === "win") {
      tone(523.25, t, 0.13, "sine", 0.075);
      tone(659.25, t + 0.075, 0.14, "sine", 0.085);
      tone(783.99, t + 0.15, 0.22, "triangle", 0.065, undefined, 2800);
      return;
    }
    if (kind === "triple_win") {
      tone(523.25, t, 0.11, "sine", 0.08);
      tone(659.25, t + 0.065, 0.11, "sine", 0.085);
      tone(783.99, t + 0.13, 0.13, "triangle", 0.085, undefined, 3000);
      tone(1046.5, t + 0.2, 0.28, "sine", 0.08);
      return;
    }
    if (kind === "lose" || kind === "triple_lose") {
      tone(220, t, 0.14, "triangle", 0.065, 165, 1100);
      tone(165, t + 0.1, 0.2, "sine", 0.055, 128, 900);
      return;
    }
    if (kind === "horn") {
      // Crisp wooden low-dissonance knock instead of harsh buzzer
      tone(294, t, 0.11, "triangle", 0.08, 220, 1200);
      tone(207, t + 0.085, 0.22, "triangle", 0.075, 148, 950);
      paperSnap(t + 0.01, 0.03);
    }
  })();
}

export function armSoundUnlock(): void {
  if (typeof window === "undefined") return;
  const once = () => {
    void unlockSound();
    window.removeEventListener("pointerdown", once);
    window.removeEventListener("keydown", once);
  };
  window.addEventListener("pointerdown", once);
  window.addEventListener("keydown", once);
}
