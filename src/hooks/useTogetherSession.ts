import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import { getDb } from '@/lib/firebase';
import type { TogetherSession } from '@/lib/together';

export type TogetherSessionStatus = 'connecting' | 'live' | 'missing' | 'error';

/** How long to wait for the first snapshot before telling the user something is wrong. */
const CONNECT_TIMEOUT_MS = 10000;

/**
 * Live view of `sessions/{code}` — the only way any screen reads a Together
 * session, so every device reacts to the same document (start, deaths, joins).
 */
export function useTogetherSession(code: string | undefined) {
  const [state, setState] = useState<{
    code: string | undefined;
    session: TogetherSession | null;
    status: TogetherSessionStatus;
  }>({ code, session: null, status: 'connecting' });

  useEffect(() => {
    if (!code) return;
    let received = false;
    const timeout = setTimeout(() => {
      if (!received) setState({ code, session: null, status: 'error' });
    }, CONNECT_TIMEOUT_MS);

    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(
        doc(getDb(), 'sessions', code),
        (snap) => {
          received = true;
          const session = (snap.data() as TogetherSession | undefined) ?? null;
          setState({ code, session, status: session ? 'live' : 'missing' });
        },
        () => setState({ code, session: null, status: 'error' })
      );
    } catch {
      // getDb() throws when Firebase isn't configured; report it asynchronously.
      clearTimeout(timeout);
      const fail = setTimeout(() => setState({ code, session: null, status: 'error' }), 0);
      return () => clearTimeout(fail);
    }

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [code]);

  // A code change shows 'connecting' straight away rather than the old session.
  return state.code === code ? state : { session: null, status: 'connecting' as const };
}
