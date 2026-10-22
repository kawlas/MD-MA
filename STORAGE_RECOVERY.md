# Storage Recovery

## Overview

MD MA uses `localStorage` to persist editor content, theme selections, font
settings, split-view ratios, and custom themes. When `localStorage` becomes
unavailable — due to quota exhaustion, browser privacy settings, or security
restrictions — writes silently fail and the user can lose their work across
sessions.

This document describes the storage-recovery system that detects, surfaces,
and recovers from `localStorage` failures **without losing the in-memory editor
buffer**.

## Design Principles

1. **Never throw on storage access.** Every `localStorage` read or write goes
   through a safe wrapper that catches errors and returns a fallback value.
2. **Data lives in React state first.** The editor buffer (`markdown`), theme,
   and all preferences are already held in React component state. A failed
   `localStorage` write does **not** discard the in-memory data.
3. **Persistent, recoverable notice.** When storage fails, a sticky banner
   appears at the top of the app explaining the problem and offering two
   actions: **Retry** and **Download**.
4. **No artificial thresholds.** There is no hardcoded 5 MB check. Failures are
   detected at the point of access — a real `QuotaExceededError` or
   `SecurityError` thrown by the browser is the signal, not a size guess.

## Module: `src/utils/storage.ts`

A module-level singleton (`storageState`) tracks whether `localStorage` is
usable and, if not, the classified error.

### Public API

| Function | Returns | Description |
|---|---|---|
| `checkStorage()` | `boolean` | Probes `localStorage` with a write+remove cycle. Resets state on success, records an error on failure. |
| `safeGetItem(key)` | `string \| null` | `getItem` wrapper. Returns `null` on any failure without throwing. Short-circuits to `null` when storage is already known to be unavailable. |
| `safeSetItem(key, value)` | `boolean` | `setItem` wrapper. Returns `false` on any failure without throwing. Short-circuits to `false` when storage is unavailable. |
| `retryStorage()` | `boolean` | Clears the error state and re-probes with `checkStorage()`. Call this after the user clicks "Retry". |
| `clearStorageError()` | `void` | Resets the singleton to the "available, no error" state without probing. Used in test setup and to reset stale state. |
| `getStorageError()` | `StorageError \| null` | Returns the current error object `{ type, message }` or `null`. |
| `isStorageUnavailable()` | `boolean` | Convenience check for `storageState.unavailable`. |
| `getStorageErrorKey()` | `StorageErrorI18nKey` | Maps the current error type to an i18n translation key. |

### Error Classification

`classifyError(e)` inspects the thrown `Error.name`:

| `Error.name` | Classified as | i18n key |
|---|---|---|
| `QuotaExceededError` | `quota_exceeded` | `app.storage.error.quota_exceeded` |
| `NS_ERROR_DOM_QUOTA_REACHED` | `quota_exceeded` | `app.storage.error.quota_exceeded` |
| `SecurityError` | `security` | `app.storage.error.security` |
| *anything else* | `unavailable` | `app.storage.error.unavailable` |

### Types

```ts
type StorageErrorType = 'quota_exceeded' | 'security' | 'unavailable';

type StorageError = {
  type: StorageErrorType;
  message: string;
};

type StorageState = {
  unavailable: boolean;
  error: StorageError | null;
};

type StorageErrorI18nKey =
  | 'app.storage.error.quota_exceeded'
  | 'app.storage.error.security'
  | 'app.storage.error.unavailable';
```

`StorageErrorI18nKey` is a structural subtype of i18n `TranslationKey`, so it
can be passed directly to `_t()` without a cast.

## Integration in `src/App.tsx`

### Mount check

```ts
useEffect(() => {
  checkStorage();
  setStorageError(getStorageError());
}, []);
```

Runs once on mount. If `localStorage` is already broken (e.g. the browser
disabled it), this immediately surfaces the error.

### State

```ts
const [storageError, setStorageError] = useState<StorageError | null>(
  () => getStorageError()
);
```

The initial value is read from the module singleton so that a failure detected
during a prior render cycle (e.g. by `safeSetItem` in a persist effect) is
reflected on first paint.

### `persist` helper

```ts
const persist = useCallback((key: string, value: string) => {
  if (!safeSetItem(key, value)) {
    setStorageError(getStorageError());
  }
}, []);
```

Replaces all `try { localStorage.setItem(...) } catch {}` blocks. When a write
fails, `safeSetItem` records the error in the singleton; `persist` mirrors it
into React state so the notice re-renders.

### `handleRetryStorage`

```ts
const handleRetryStorage = useCallback(() => {
  if (retryStorage()) {
    setStorageError(null);
    showToast(_t('app.storage.error.retry_success'));
    // Re-persist all keys from React state
    safeSetItem('md-editor-content', latestMdRef.current);
    safeSetItem('md-editor-theme', theme);
    // ... (5 more keys)
  } else {
    setStorageError(getStorageError());
    showToast(_t('app.storage.error.retry_failed'));
  }
}, [...deps]);
```

On success (storage is now writable), the error is cleared and **all persisted
keys are re-written from current React state**, recovering the user's data. On
failure, the error is refreshed and a failure toast is shown.

### Notice banner

```tsx
{storageError && (
  <div className="storage-notice">
    <span className="storage-notice-msg">
      {_t(getStorageErrorKey())}
    </span>
    <button className="storage-notice-btn storage-notice-retry" onClick={handleRetryStorage}>
      {_t('app.storage.error.retry')}
    </button>
    <button className="storage-notice-btn storage-notice-download" onClick={handleSaveAs}>
      {_t('toolbar.save')}
    </button>
  </div>
)}
```

Rendered between the Toolbar and the main content. It is **sticky** (always
visible at the top) and persists until the user successfully retries.

## Locale keys (`src/i18n.tsx`)

| Key | EN example | PL example |
|---|---|---|
| `app.storage.error.quota_exceeded` | "Storage is full — click Download to save your work, then clear some space and Retry." | "Pamięć jest pełna — kliknij Pobierz, aby zapisać pracę, wyczyść miejsce i spróbuj ponownie." |
| `app.storage.error.security` | "Storage access was blocked by a security policy — click Download to save your work, then Retry." | "Dostęp do pamięci został zablokowany przez politykę bezpieczeństwa — kliknij Pobierz, aby zapisać pracę, a następnie spróbuj ponownie." |
| `app.storage.error.unavailable` | "Local storage is unavailable — click Download to save your work, then Retry." | "Pamięć lokalna jest niedostępna — kliknij Pobierz, aby zapisać pracę, a następnie spróbuj ponownie." |
| `app.storage.error.recoverable` | "Your work is safe in memory — no data was lost." | "Twoja praca jest bezpieczna w pamięci — nie utracono żadnych danych." |
| `app.storage.error.retry` | "Retry" | "Ponów próbę" |
| `app.storage.error.retry_success` | "Storage recovered — your work has been saved." | "Pamięć odtworzona — Twoja praca została zapisana." |
| `app.storage.error.retry_failed` | "Storage is still unavailable — please download your work." | "Pamięć nadal niedostępna — pobierz swoją pracę." |

> The `app.storage.error.recoverable` key is used as a general reassurance
> message when storage fails but data is intact in React state. It is available
> for future use (e.g. a compact dismissible hint).

## localStorage keys

All keys that previously used `localStorage.getItem`/`setItem` directly are
now accessed through `safeGetItem`/`safeSetItem`:

| Key | Purpose |
|---|---|
| `md-editor-content` | Raw markdown string |
| `md-editor-theme` | Theme name string |
| `md-editor-custom-themes` | JSON: `Record<string, ThemeVars>` |
| `md-editor-font-set` | Selected font set identifier |
| `md-editor-split-ratio` | Split-view pane ratio (0–1) |
| `md-editor-font-size-delta` | Font size adjustment steps |
| `md-editor-line-height-delta` | Line height adjustment steps |

## Testing

### Unit tests: `src/utils/storage.test.ts`

28 tests covering:

- `checkStorage` — success, QuotaExceededError, NS_ERROR_DOM_QUOTA_REACHED,
  SecurityError, generic error, removeItem failure.
- `safeGetItem` — success, missing key, throws (returns null + records error),
  short-circuit when unavailable.
- `safeSetItem` — success, overwrite, QuotaExceededError, SecurityError,
  generic error, short-circuit when unavailable.
- `retryStorage` — recovery after restoration, failure when still broken,
  clears stale state before probing.
- `clearStorageError` — resets state, safe to call when no error.
- `getStorageError` / `isStorageUnavailable` — null/false on fresh state,
  error after failure.
- `getStorageErrorKey` — correct key per error type, default to unavailable.

### App-level tests: `src/App.test.tsx` (`describe("App: storage recovery")`)

5 tests covering:

1. Notice appears with quota_exceeded key when `setItem` throws.
2. Notice appears with security key when `setItem` throws SecurityError.
3. Notice does **not** appear when storage works normally.
4. Notice disappears after clicking Retry when storage recovers.
5. Editor buffer is preserved in React state during a storage failure.

### i18n parity: `src/i18n.test.ts`

The 7 new EN keys are added to `EN_KEYS` so the "all English keys have
Polish translations" parity test covers them.

## What was NOT done

- **No 5 MB threshold.** Storage availability is probed by actually writing
  and removing a test key — the same mechanism browsers use natively.
- **No Native File System API.** Persistence still uses `localStorage` for
  cross-browser compatibility. The Download (Ctrl/Cmd+S) button remains the
  fallback for saving work.
- **i18n direct `localStorage` usage** (locale preference in `i18n.tsx`,
  lines 313 and 329) was left as-is — it was already wrapped in try/catch.
