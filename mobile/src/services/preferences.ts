/**
 * Local Preferences Service
 *
 * Persists user-facing app preferences (notification + security toggles) on the
 * device so they survive app restarts. Uses expo-secure-store when available and
 * falls back to an in-memory map (e.g. during tests) so callers never throw.
 *
 * These are client-side device preferences. Server-side notification routing is
 * owned by the backend notification settings API; this layer keeps the on-device
 * UI state durable and is the integration point for syncing to that API once a
 * mobile preferences endpoint is available.
 */

let SecureStore: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SecureStore = require('expo-secure-store');
} catch (_e) {
  // expo-secure-store unavailable (e.g. test environment) — fall back to memory.
}

const PREFERENCES_KEY = 'complyeasy_preferences';

export interface NotificationPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  biometricAuth: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  pushNotifications: true,
  emailNotifications: true,
  biometricAuth: false,
};

// In-memory mirror; also the storage of record when SecureStore is unavailable.
let cache: NotificationPreferences = { ...DEFAULT_PREFERENCES };

/**
 * Load persisted preferences, merged over the defaults. Safe to call repeatedly.
 */
export async function loadPreferences(): Promise<NotificationPreferences> {
  if (!SecureStore) {
    return { ...cache };
  }
  try {
    const raw = await SecureStore.getItemAsync(PREFERENCES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
      cache = { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (err) {
    // Corrupt or unreadable store — fall back to the last known/default values.
    console.warn('[Preferences] Failed to load stored preferences:', err);
  }
  return { ...cache };
}

/**
 * Persist a single preference, merging it into the stored set.
 */
export async function savePreference<K extends keyof NotificationPreferences>(
  key: K,
  value: NotificationPreferences[K]
): Promise<void> {
  cache = { ...cache, [key]: value };
  if (!SecureStore) return;
  try {
    await SecureStore.setItemAsync(PREFERENCES_KEY, JSON.stringify(cache));
  } catch (err) {
    // Write failed — value remains in the in-memory cache for this session.
    console.warn('[Preferences] Failed to persist preference:', err);
  }
}

export default { loadPreferences, savePreference, DEFAULT_PREFERENCES };
