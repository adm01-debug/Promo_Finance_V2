/**
 * Cross-tab synchronization for SSO Single Logout (SLO).
 *
 * When the user triggers SSO logout on one tab, every other authenticated tab
 * needs to drop its session immediately and navigate to the public auth page,
 * showing exactly one toast. We use BroadcastChannel as the primary transport
 * and fall back to a localStorage-event sentinel for environments where
 * BroadcastChannel is unavailable (older Safari, sandboxed iframes).
 */

const CHANNEL_NAME = 'sso-sync';
const STORAGE_SENTINEL_KEY = 'sso-slo-broadcast';

export type SsoSyncMessage = {
  type: 'sso-slo-initiated';
  providerNome: string;
  ts: number;
};

export function broadcastSsoSlo(providerNome: string): number {
  const payload: SsoSyncMessage = {
    type: 'sso-slo-initiated',
    providerNome,
    ts: Date.now(),
  };

  // Primary: BroadcastChannel
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.postMessage(payload);
      // Close on next tick so the message is flushed.
      setTimeout(() => {
        try { bc.close(); } catch { /* noop */ }
      }, 0);
    }
  } catch { /* fall through to storage fallback */ }

  // Fallback: storage event sentinel (also fires in other tabs of same origin)
  try {
    window.localStorage.setItem(STORAGE_SENTINEL_KEY, JSON.stringify(payload));
    // Remove immediately so a subsequent broadcast with same payload still triggers.
    window.localStorage.removeItem(STORAGE_SENTINEL_KEY);
  } catch { /* noop */ }

  return payload.ts;
}

export function subscribeSsoSlo(handler: (msg: SsoSyncMessage) => void): () => void {
  let bc: BroadcastChannel | null = null;

  const onMessage = (ev: MessageEvent<SsoSyncMessage>) => {
    if (ev.data?.type === 'sso-slo-initiated') handler(ev.data);
  };

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(CHANNEL_NAME);
      bc.addEventListener('message', onMessage);
    }
  } catch { /* noop */ }

  const onStorage = (ev: StorageEvent) => {
    if (ev.key !== STORAGE_SENTINEL_KEY || !ev.newValue) return;
    try {
      const parsed = JSON.parse(ev.newValue) as SsoSyncMessage;
      if (parsed.type === 'sso-slo-initiated') handler(parsed);
    } catch { /* ignore malformed payload */ }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    try { bc?.removeEventListener('message', onMessage); } catch { /* noop */ }
    try { bc?.close(); } catch { /* noop */ }
    window.removeEventListener('storage', onStorage);
  };
}
