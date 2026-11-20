import {
  advance,
  applyAction,
  continueFromSettlement,
  createTable,
  currentPlayer,
  DEFAULT_CONFIG,
  FX_MS,
  LLM_PERSONAS,
  pickN,
  planBotTurn,
  planTableReactions,
  revealHoldMs,
  startHand,
  toPublicState,
  type BubbleMood,
  type PlayerAction,
  type PublicState,
  type SeatBubble,
  type TableState,
} from "@hotpot/engine";
import type { WebSocket } from "ws";
import { roomCode, normalizeName, type Session } from "./session.js";

export interface Seat {
  id: string;
  name: string;
  kind: "human" | "bot";
  personaId?: string;
  connected: boolean;
}

export interface RoomSnapshot {
  code: string;
  mode: "pve" | "pvp";
  hostId: string;
  started: boolean;
  you: string;
  seats: Seat[];
  state: PublicState | null;
  deadline: number | null;
  status: string;
  bubbles: Record<string, SeatBubble>;
}

interface Room {
  code: string;
  mode: "pve" | "pvp";
  hostId: string;
  seats: Seat[];
  table: TableState | null;
  sockets: Map<string, Set<WebSocket>>;
  deadline: number | null;
  bubbles: Record<string, SeatBubble>;
  bubbleSeq: number;
  timers: {
    bot?: ReturnType<typeof setTimeout>;
    action?: ReturnType<typeof setTimeout>;
    advance?: ReturnType<typeof setTimeout>;
    settle?: ReturnType<typeof setTimeout>;
  };
  thoughtTimers: ReturnType<typeof setTimeout>[];
  reactionTimers: Set<ReturnType<typeof setTimeout>>;
  usedPersonas: Set<string>;
  rng: number;
}

const rooms = new Map<string, Room>();
const TURN_MS = 30_000;

function statusText(room: Room): string {
  if (!room.table) {
    const humans = room.seats.filter((s) => s.kind === "human").length;
    return `等待开局（${humans}/4）`;
  }
  const { table } = room;
  if (table.phase === "awaiting") {
    const p = currentPlayer(table);
    if (!p) return "等待行动";
    return p.kind === "bot" ? `${p.name} 思考中` : `轮到 ${p.name} 添菜`;
  }
  if (table.phase === "reveal") {
    const kind = table.outcome?.kind;
    if (kind === "consecutive") return "连张，自动放弃";
    if (kind === "horn") return table.outcome?.multiplier === 4 ? "超级牛角尖！" : "牛角尖！";
    if (kind === "triple_win") return "三张通吃！";
    if (kind === "win") return "爽吃许愿池";
    if (kind === "lose" || kind === "triple_lose") return "挨饿";
    return "结算中";
  }
  if (table.phase === "settlement") return "本盘结束";
  if (table.phase === "gameover") return "对局结束";
  return "准备中";
}

function snapshot(room: Room, you: string): RoomSnapshot {
  return {
    code: room.code,
    mode: room.mode,
    hostId: room.hostId,
    started: Boolean(room.table),
    you,
    seats: room.seats,
    state: room.table ? toPublicState(room.table) : null,
    deadline: room.deadline,
    status: statusText(room),
    bubbles: { ...room.bubbles },
  };
}

function send(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === 1) ws.send(JSON.stringify(payload));
}

function broadcast(room: Room): void {
  for (const [playerId, sockets] of room.sockets) {
    const payload = { type: "state", ...snapshot(room, playerId) };
    for (const ws of sockets) send(ws, payload);
  }
}

function clearThoughtTimers(room: Room): void {
  for (const t of room.thoughtTimers) clearTimeout(t);
  room.thoughtTimers = [];
}

function clearReactionTimers(room: Room): void {
  for (const t of room.reactionTimers) clearTimeout(t);
  room.reactionTimers.clear();
}

function clearThinkBubbles(room: Room): void {
  for (const [pid, b] of Object.entries(room.bubbles)) {
    if (b.kind === "think") delete room.bubbles[pid];
  }
}

function clearAllBubbles(room: Room): void {
  clearThoughtTimers(room);
  clearReactionTimers(room);
  room.bubbles = {};
}

function clearTimers(room: Room, keepReactions = false): void {
  for (const key of Object.keys(room.timers) as (keyof Room["timers"])[]) {
    const t = room.timers[key];
    if (t) clearTimeout(t);
    room.timers[key] = undefined;
  }
  clearThoughtTimers(room);
  if (!keepReactions) {
    clearReactionTimers(room);
    room.bubbles = {};
  }
  room.deadline = null;
}

function setBubble(
  room: Room,
  playerId: string,
  text: string,
  kind: "think" | "react",
  mood?: BubbleMood,
  ttlMs?: number,
): void {
  room.bubbleSeq += 1;
  const id = room.bubbleSeq;
  room.bubbles[playerId] = { id, text, kind, mood };
  if (ttlMs && ttlMs > 0) {
    const timer = setTimeout(() => {
      room.reactionTimers.delete(timer);
      if (room.bubbles[playerId]?.id === id) {
        delete room.bubbles[playerId];
        broadcast(room);
      }
    }, ttlMs);
    room.reactionTimers.add(timer);
  }
}

function takePersonas(room: Room, n: number): typeof LLM_PERSONAS[number][] {
  const available = LLM_PERSONAS.filter((p) => !room.usedPersonas.has(p.id));
  const { picked, rng } = pickN(available, n, room.rng);
  room.rng = rng;
  for (const p of picked) room.usedPersonas.add(p.id);
  return picked;
}

function fillBots(room: Room): void {
  const missing = 4 - room.seats.length;
  if (missing <= 0) return;
  const personas = takePersonas(room, missing);
  for (const persona of personas) {
    room.seats.push({
      id: `bot:${persona.id}:${room.code}`,
      name: persona.name,
      kind: "bot",
      personaId: persona.id,
      connected: true,
    });
  }
}

function startTable(room: Room): void {
  fillBots(room);
  clearAllBubbles(room);
  room.table = startHand(
    createTable(
      room.seats.map((s) => ({
        id: s.id,
        name: s.name,
        kind: s.kind,
        personaId: s.personaId,
      })),
      { ...DEFAULT_CONFIG },
      room.rng,
    ),
  );
  if (hasHumanSocket(room)) schedule(room);
  broadcast(room);
}

function hasHumanSocket(room: Room): boolean {
  return room.seats.some((s) => s.kind === "human" && (room.sockets.get(s.id)?.size ?? 0) > 0);
}

function ensureLoop(room: Room): void {
  if (!room.table) return;
  if (room.timers.bot || room.timers.action || room.timers.advance || room.timers.settle) return;
  schedule(room);
}

function schedule(room: Room): void {
  const table = room.table;
  const keepReactions = Boolean(table && (table.phase === "awaiting" || table.phase === "reveal"));
  clearTimers(room, keepReactions);
  if (!table) return;

  if (table.phase === "awaiting") {
    clearThinkBubbles(room);
    const player = currentPlayer(table);
    if (!player) return;
    if (player.kind === "bot") {
      const plan = planBotTurn(table);
      room.deadline = null;

      for (const beat of plan.thoughts) {
        const t = setTimeout(() => {
          if (
            !room.table ||
            room.table.phase !== "awaiting" ||
            currentPlayer(room.table)?.id !== player.id
          ) {
            return;
          }
          setBubble(room, player.id, beat.text, "think", beat.mood);
          broadcast(room);
        }, beat.atMs);
        room.thoughtTimers.push(t);
      }

      room.timers.bot = setTimeout(() => {
        try {
          if (room.bubbles[player.id]?.kind === "think") {
            delete room.bubbles[player.id];
          }
          room.table = applyAction(room.table!, player.id, plan.action);
          broadcast(room);
          schedule(room);
        } catch (err) {
          console.error(err);
        }
      }, plan.thinkMs);
      broadcast(room);
      return;
    }

    const seat = room.seats.find((s) => s.id === player.id);
    if (seat && !seat.connected) {
      room.timers.action = setTimeout(() => autoFold(room, player.id), 8_000);
      room.deadline = Date.now() + 8_000;
      broadcast(room);
      return;
    }
    room.deadline = Date.now() + TURN_MS;
    room.timers.action = setTimeout(() => autoFold(room, player.id), TURN_MS);
    broadcast(room);
    return;
  }

  if (table.phase === "reveal") {
    clearThinkBubbles(room);
    const outcomeKind = table.outcome?.kind ?? "fold";
    const delay = revealHoldMs(outcomeKind);
    const beatDelay =
      outcomeKind === "fold" || outcomeKind === "consecutive"
        ? 240
        : FX_MS.wager + FX_MS.flip + 180;

    const reactions = planTableReactions(table);
    for (const r of reactions) {
      const timer = setTimeout(() => {
        room.reactionTimers.delete(timer);
        if (!room.table || room.table.phase === "settlement" || room.table.phase === "gameover") {
          return;
        }
        // Never overwrite an active thinking bubble on that seat.
        if (room.bubbles[r.playerId]?.kind === "think") return;
        setBubble(room, r.playerId, r.text, "react", r.mood, 2_500);
        broadcast(room);
      }, beatDelay + r.delayMs);
      room.reactionTimers.add(timer);
    }

    room.timers.advance = setTimeout(() => {
      room.table = advance(room.table!);
      broadcast(room);
      schedule(room);
    }, delay);
    return;
  }

  if (table.phase === "settlement") {
    clearAllBubbles(room);
    room.timers.settle = setTimeout(() => {
      room.table = continueFromSettlement(room.table!);
      broadcast(room);
      schedule(room);
    }, 9_000);
  }
}

function autoFold(room: Room, playerId: string): void {
  if (!room.table || room.table.phase !== "awaiting") return;
  const current = currentPlayer(room.table);
  if (!current || current.id !== playerId) return;
  try {
    room.table = applyAction(room.table, playerId, { type: "fold" });
    broadcast(room);
    schedule(room);
  } catch (err) {
    console.error(err);
  }
}

export function createRoom(session: Session, mode: "pve" | "pvp"): RoomSnapshot {
  if (session.roomCode && rooms.get(session.roomCode)) {
    leaveRoom(session);
  }
  let code = roomCode();
  while (rooms.has(code)) code = roomCode();
  const room: Room = {
    code,
    mode,
    hostId: session.playerId,
    seats: [
      {
        id: session.playerId,
        name: session.name,
        kind: "human",
        connected: false,
      },
    ],
    table: null,
    sockets: new Map(),
    deadline: null,
    bubbles: {},
    bubbleSeq: 0,
    timers: {},
    thoughtTimers: [],
    reactionTimers: new Set(),
    usedPersonas: new Set(),
    rng: Date.now() % 0x7fffffff,
  };
  rooms.set(code, room);
  session.roomCode = code;
  if (mode === "pve") startTable(room);
  return snapshot(room, session.playerId);
}

export function joinRoom(session: Session, code: string): RoomSnapshot {
  const room = rooms.get(code.toUpperCase());
  if (!room) throw new Error("房间不存在");
  const existing = room.seats.find((s) => s.id === session.playerId);
  if (existing) {
    session.roomCode = room.code;
    return snapshot(room, session.playerId);
  }
  if (room.table) throw new Error("对局已经开始");
  if (room.seats.filter((s) => s.kind === "human").length >= 4) {
    throw new Error("房间已满");
  }
  if (room.seats.length >= 4) throw new Error("房间已满");
  room.seats.push({
    id: session.playerId,
    name: session.name,
    kind: "human",
    connected: false,
  });
  session.roomCode = room.code;
  broadcast(room);
  if (room.seats.length === 4) startTable(room);
  return snapshot(room, session.playerId);
}

export function attachSocket(session: Session, ws: WebSocket): void {
  if (!session.roomCode) {
    send(ws, { type: "error", message: "还没有加入房间" });
    return;
  }
  const room = rooms.get(session.roomCode);
  if (!room) {
    send(ws, { type: "error", message: "房间已解散" });
    return;
  }
  const seat = room.seats.find((s) => s.id === session.playerId);
  if (!seat) {
    send(ws, { type: "error", message: "你不在这张桌上" });
    return;
  }
  seat.connected = true;
  let set = room.sockets.get(session.playerId);
  if (!set) {
    set = new Set();
    room.sockets.set(session.playerId, set);
  }
  set.add(ws);
  send(ws, { type: "state", ...snapshot(room, session.playerId) });
  ensureLoop(room);
  broadcast(room);

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(String(raw)) as {
        type: string;
        action?: PlayerAction;
        name?: string;
      };
      if (msg.type === "action" && msg.action) {
        play(room, session.playerId, msg.action);
      } else if (msg.type === "continue") {
        continueHand(room, session.playerId);
      } else if (msg.type === "start") {
        hostStart(room, session.playerId);
      } else if (msg.type === "fill_bots") {
        hostFill(room, session.playerId);
      } else if (msg.type === "rename") {
        renamePlayer(room, session, msg.name ?? "");
      }
    } catch (err) {
      send(ws, { type: "error", message: err instanceof Error ? err.message : "行动失败" });
    }
  });

  ws.on("close", () => {
    set!.delete(ws);
    if (set!.size === 0) {
      room.sockets.delete(session.playerId);
      const current = room.seats.find((s) => s.id === session.playerId);
      if (current) {
        current.connected = false;
        broadcast(room);
      }
    }
  });
}

function renamePlayer(room: Room, session: Session, name: string): void {
  const trimmed = normalizeName(name);
  session.name = trimmed;
  const seat = room.seats.find((s) => s.id === session.playerId);
  if (seat?.kind === "human") seat.name = trimmed;
  if (room.table) {
    const player = room.table.players.find((p) => p.id === session.playerId);
    if (player?.kind === "human") player.name = trimmed;
  }
  broadcast(room);
}

function play(room: Room, playerId: string, action: PlayerAction): void {
  if (!room.table) throw new Error("对局尚未开始");
  room.table = applyAction(room.table, playerId, action);
  broadcast(room);
  schedule(room);
}

function continueHand(room: Room, playerId: string): void {
  if (!room.table || room.table.phase !== "settlement") return;
  if (playerId !== room.hostId && currentPlayer(room.table)?.id !== playerId) {
    // any seated human may continue
  }
  clearTimers(room);
  room.table = continueFromSettlement(room.table);
  broadcast(room);
  schedule(room);
}

function hostStart(room: Room, playerId: string): void {
  if (room.hostId !== playerId) throw new Error("只有房主可以开局");
  if (room.table) return;
  startTable(room);
}

function hostFill(room: Room, playerId: string): void {
  if (room.hostId !== playerId) throw new Error("只有房主可以补齐 Bot");
  if (room.table) return;
  startTable(room);
}

function removeHuman(room: Room, playerId: string): boolean {
  room.seats = room.seats.filter((s) => s.id !== playerId);
  if (room.hostId === playerId) {
    const nextHost = room.seats.find((s) => s.kind === "human");
    if (nextHost) room.hostId = nextHost.id;
  }
  if (!room.seats.some((s) => s.kind === "human")) {
    clearTimers(room);
    rooms.delete(room.code);
    return true;
  }
  return false;
}

function abortPvpTable(room: Room): void {
  clearTimers(room);
  room.table = null;
  room.seats = room.seats.filter((s) => s.kind === "human");
  room.usedPersonas.clear();
}

export function leaveRoom(session: Session): void {
  const code = session.roomCode;
  if (!code) return;
  const room = rooms.get(code);
  session.roomCode = null;
  if (!room) return;
  const sockets = room.sockets.get(session.playerId);
  if (sockets) {
    for (const ws of sockets) ws.close();
    room.sockets.delete(session.playerId);
  }
  if (room.table && room.mode === "pvp") {
    abortPvpTable(room);
    if (!removeHuman(room, session.playerId)) broadcast(room);
    return;
  }
  if (!room.table || room.mode === "pve") {
    if (!removeHuman(room, session.playerId)) broadcast(room);
    return;
  }
  const seat = room.seats.find((s) => s.id === session.playerId);
  if (seat) seat.connected = false;
  broadcast(room);
}

export function roomSnapshotFor(session: Session): RoomSnapshot | null {
  if (!session.roomCode) return null;
  const room = rooms.get(session.roomCode);
  if (!room) {
    session.roomCode = null;
    return null;
  }
  if (!room.seats.some((s) => s.id === session.playerId)) return null;
  return snapshot(room, session.playerId);
}
