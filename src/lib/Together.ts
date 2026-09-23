import {
  deleteField,
  doc,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

import { findTogetherFlower, TogetherFlowers, type TogetherFlowerId } from '@/data/Plants';
import { getDb, withTimeout } from '@/lib/Firebase';

/**
 * Together sessions: one Firestore document per session, `sessions/{code}`
 * (PROJECT_PLAN.md section 6). Every device listens to that one document;
 * everything here is a small field update on it.
 */

/**
 * Seconds between the host tapping start and the shared plant starting to
 * grow — time for everyone to lay their phone down. Stillness is only checked
 * after it, so nobody kills the plant while still putting their phone down.
 */
export const LEAD_IN_SECONDS = 10;

export type Member = { name: string; joinedAt: Timestamp | null };

export type TogetherSession = {
  hostId: string;
  hostName: string;
  flowerId: TogetherFlowerId;
  durationSeconds: number;
  /** Server time the host pressed start. The ONE source of truth for every device's countdown. */
  startTimestamp: Timestamp | null;
  /** Once false, never true again — the session can't earn a flower any more. */
  plantAlive: boolean;
  killedBy: string | null;
  killedById: string | null;
  /** The host left the lobby before starting. */
  closed: boolean;
  members: Record<string, Member>;
  createdAt: Timestamp | null;
};

export type TogetherErrorCode = 'notFound' | 'started' | 'closed' | 'generic';

export class TogetherError extends Error {
  constructor(public code: TogetherErrorCode) {
    super(code);
  }
}

// No 0/O, 1/I/L — codes get read out loud across a table.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 5;
/** A code whose session is this old is free to reuse. */
const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

export function normalizeCode(input: string) {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, CODE_LENGTH);
}

function randomCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

function sessionRef(code: string) {
  return doc(getDb(), 'sessions', code);
}

// --- Shared clock ---------------------------------------------------------
//
// Phones' clocks disagree by seconds. The start moment is a *server*
// timestamp, so each device measures how far its own clock is from the
// server's once, when it joins, and converts the shared start into local time.

let serverOffsetMs = 0;

/** The shared start as a local `Date.now()` value, lead-in included — feed this to useSessionTimer. */
export function localFocusStart(session: TogetherSession) {
  if (!session.startTimestamp) return null;
  return session.startTimestamp.toMillis() - serverOffsetMs + LEAD_IN_SECONDS * 1000;
}

/**
 * Called straight after this device writes its own `joinedAt` server
 * timestamp: the server stamped it somewhere between sending and the ack,
 * so the midpoint is a good estimate of "server now" in local time.
 */
async function syncClock(code: string, memberId: string, sentAt: number, ackedAt: number) {
  try {
    const snap = await withTimeout(getDocFromServer(sessionRef(code)));
    const joinedAt = (snap.data() as TogetherSession | undefined)?.members[memberId]?.joinedAt;
    if (joinedAt) serverOffsetMs = joinedAt.toMillis() - (sentAt + ackedAt) / 2;
  } catch {
    // Keep the previous estimate; being a second off beats not joining.
  }
}

// --- Lobby -----------------------------------------------------------------

export async function hostSession(memberId: string, name: string): Promise<string> {
  const db = getDb();
  const flower = TogetherFlowers[1] ?? TogetherFlowers[0];

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const ref = sessionRef(code);
    const sentAt = Date.now();
    const created = await withTimeout(
      runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const existing = snap.data() as TogetherSession | undefined;
        const isStale =
          !existing ||
          existing.closed ||
          (existing.createdAt?.toMillis() ?? 0) < Date.now() - STALE_AFTER_MS;
        if (!isStale) return false;
        tx.set(ref, {
          hostId: memberId,
          hostName: name,
          flowerId: flower.id,
          durationSeconds: flower.togetherSeconds,
          startTimestamp: null,
          plantAlive: true,
          killedBy: null,
          killedById: null,
          closed: false,
          members: { [memberId]: { name, joinedAt: serverTimestamp() } },
          createdAt: serverTimestamp(),
        });
        return true;
      })
    );
    if (created) {
      await syncClock(code, memberId, sentAt, Date.now());
      return code;
    }
  }
  throw new TogetherError('generic');
}

export async function joinSession(code: string, memberId: string, name: string) {
  const ref = sessionRef(code);
  const sentAt = Date.now();
  await withTimeout(
    runTransaction(getDb(), async (tx) => {
      const snap = await tx.get(ref);
      const session = snap.data() as TogetherSession | undefined;
      if (!session) throw new TogetherError('notFound');
      if (session.closed) throw new TogetherError('closed');
      const isMember = memberId in session.members;
      // Rejoining your own running session (e.g. after an app restart) is fine.
      if (session.startTimestamp && !isMember) throw new TogetherError('started');
      if (!isMember) {
        tx.update(ref, { [`members.${memberId}`]: { name, joinedAt: serverTimestamp() } });
      }
    })
  );
  await syncClock(code, memberId, sentAt, Date.now());
}

/** Best effort: leaving must never block navigation. */
export async function leaveSession(code: string, memberId: string, isHost: boolean) {
  try {
    await withTimeout(
      updateDoc(sessionRef(code), isHost ? { closed: true } : { [`members.${memberId}`]: deleteField() }),
      4000
    );
  } catch {
    // Offline or already gone — nothing to clean up that matters.
  }
}

export async function chooseFlower(code: string, flowerId: TogetherFlowerId) {
  const flower = findTogetherFlower(flowerId);
  if (!flower) return;
  await withTimeout(
    updateDoc(sessionRef(code), { flowerId, durationSeconds: flower.togetherSeconds })
  );
}

/** Writes the ONE shared start moment. Everyone's countdown is derived from it. */
export async function startSession(code: string) {
  await withTimeout(
    // plantAlive is untouched: it starts true at creation and only ever goes false.
    updateDoc(sessionRef(code), { startTimestamp: serverTimestamp() })
  );
}

// --- During the session ------------------------------------------------------

/**
 * First mover wins: a transaction, so two people lifting their phones at
 * once can't overwrite each other's name, and a dead plant is never revived.
 */
export async function killPlant(code: string, memberId: string, name: string) {
  const ref = sessionRef(code);
  try {
    await withTimeout(
      runTransaction(getDb(), async (tx) => {
        const session = (await tx.get(ref)).data() as TogetherSession | undefined;
        if (!session?.plantAlive || !session.startTimestamp) return;
        tx.update(ref, { plantAlive: false, killedBy: name, killedById: memberId });
      })
    );
  } catch {
    // Transactions need the server. Offline, fall back to a plain write:
    // Firestore queues it and delivers it on reconnect, so the rest of the
    // group's reward check still sees the plant as dead.
    updateDoc(ref, { plantAlive: false, killedBy: name, killedById: memberId }).catch(() => {});
  }
}

/**
 * The reward gate. The local timer finishing isn't enough: a kill from
 * another phone may still be in flight, so ask the server directly whether
 * the plant is alive AND the full time has passed. Rejects when the server
 * can't be reached — the caller offers a retry, never a free flower.
 */
export async function confirmSurvived(code: string): Promise<boolean> {
  const snap = await withTimeout(getDocFromServer(sessionRef(code)));
  const session = snap.data() as TogetherSession | undefined;
  if (!session?.plantAlive) return false;
  const start = localFocusStart(session);
  if (start === null) return false;
  // One second of slack for the clock estimate.
  return Date.now() >= start + session.durationSeconds * 1000 - 1000;
}
