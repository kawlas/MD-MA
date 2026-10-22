/**
 * Storage utility for safe localStorage operations.
 * Detects and handles quota exceeded, security, and unavailability errors.
 *
 * All read/write access to localStorage in the app MUST go through
 * safeGetItem / safeSetItem so that failures are captured in a single
 * state location and surfaced to the user via a persistent notice.
 *
 * The editor buffer lives in React state (App.tsx), so a failed write
 * does NOT lose user data — it simply won't persist to localStorage.
 * The persistent notice reminds the user to use "Download" to save
 * their work, and offers a "Retry" button that re-probes storage.
 */

export type StorageErrorType = "quota_exceeded" | "security" | "unavailable";

export type StorageError = {
  type: StorageErrorType;
  message: string;
};

export type StorageState = {
  unavailable: boolean;
  error: StorageError | null;
};

/**
 * I18n keys for the three classified storage failure types.
 * Compatible with the `TranslationKey` type from `@/i18n.tsx` (structural
 * string-literal subtype), so the return value of `getStorageErrorKey`
 * can be passed directly to `_t()`.
 */
export type StorageErrorI18nKey =
  | "app.storage.error.quota_exceeded"
  | "app.storage.error.security"
  | "app.storage.error.unavailable";

// ── Module-level state ─────────────────────────────────────────
// In a single-file-bundle app there is exactly one App instance, so a
// module singleton is sufficient and avoids extra React plumbing.
let storageState: StorageState = {
  unavailable: false,
  error: null,
};

/** Classify a DOMException or Error into a storage error type. */
function classifyError(e: unknown): StorageError {
  const error = e instanceof Error ? e : new Error(String(e));
  const name = error.name;
  const errType: StorageErrorType =
    name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED"
      ? "quota_exceeded"
      : name === "SecurityError"
        ? "security"
        : "unavailable";
  return { type: errType, message: error.message };
}

/**
 * Probe localStorage with a write+remove cycle.
 * Resets state on success; sets it on failure.
 * Returns true if storage is usable.
 */
export function checkStorage(): boolean {
  try {
    const testKey = "__storage_check__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    storageState = { unavailable: false, error: null };
    return true;
  } catch (e) {
    storageState = { unavailable: true, error: classifyError(e) };
    return false;
  }
}

/**
 * Safe getItem — never throws. Returns null on any storage failure.
 * On failure, records the error so the UI can show a notice.
 */
export function safeGetItem(key: string): string | null {
  try {
    if (storageState.unavailable) return null;
    return localStorage.getItem(key);
  } catch (e) {
    storageState = { unavailable: true, error: classifyError(e) };
    return null;
  }
}

/**
 * Safe setItem — never throws. Returns false on any storage failure.
 * On failure, records the error so the UI can show a notice.
 * The editor buffer always lives in React state, so a failed write
 * does NOT lose user data — it simply won't persist to localStorage.
 */
export function safeSetItem(key: string, value: string): boolean {
  if (storageState.unavailable) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    storageState = { unavailable: true, error: classifyError(e) };
    return false;
  }
}

/**
 * Retry storage after a failure. Clears the error state and re-probes.
 * Returns true if storage is now usable.
 */
export function retryStorage(): boolean {
  // Reset first so checkStorage can detect a genuine failure
  storageState = { unavailable: false, error: null };
  return checkStorage();
}

/**
 * Reset storage error state without re-probing.
 * Used when the caller wants to clear the cached error.
 */
export function clearStorageError(): void {
  storageState = { unavailable: false, error: null };
}

/**
 * Get the current storage error, if any.
 */
export function getStorageError(): StorageError | null {
  return storageState.error;
}

/**
 * Check if storage is currently unavailable due to errors.
 */
export function isStorageUnavailable(): boolean {
  return storageState.unavailable;
}

/**
 * Map the current storage error type to an i18n translation key.
 */
export function getStorageErrorKey(): StorageErrorI18nKey {
  const type = storageState.error?.type ?? "unavailable";
  switch (type) {
    case "quota_exceeded":
      return "app.storage.error.quota_exceeded";
    case "security":
      return "app.storage.error.security";
    case "unavailable":
    default:
      return "app.storage.error.unavailable";
  }
}
