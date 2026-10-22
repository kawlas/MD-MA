import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  checkStorage,
  safeGetItem,
  safeSetItem,
  retryStorage,
  clearStorageError,
  getStorageError,
  isStorageUnavailable,
  getStorageErrorKey,
} from "./storage";

/**
 * Create a fresh localStorage mock with spy-able methods.
 * Individual tests can override `setItem`/`removeItem` with
 * `mock.mockImplementation(() => { throw ... })` to simulate failures.
 */
function makeStorageMock() {
  const store = new Map<string, string>();
  return {
    store,
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
}

let mock: ReturnType<typeof makeStorageMock>;

beforeEach(() => {
  mock = makeStorageMock();
  vi.stubGlobal("localStorage", mock);
  // Reset the module-level singleton between tests
  clearStorageError();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── checkStorage ────────────────────────────────────────────────

describe("checkStorage", () => {
  it("returns true and clears error when localStorage is writable", () => {
    expect(checkStorage()).toBe(true);
    expect(isStorageUnavailable()).toBe(false);
    expect(getStorageError()).toBeNull();
  });

  it("returns false and sets quota_exceeded error on QuotaExceededError", () => {
    const err = new Error("quota");
    err.name = "QuotaExceededError";
    mock.setItem.mockImplementation(() => {
      throw err;
    });

    expect(checkStorage()).toBe(false);
    expect(isStorageUnavailable()).toBe(true);
    const error = getStorageError();
    expect(error).not.toBeNull();
    expect(error!.type).toBe("quota_exceeded");
    expect(error!.message).toBe("quota");
  });

  it("returns false and sets quota_exceeded error for Firefox quota error", () => {
    const err = new Error("quota ff");
    err.name = "NS_ERROR_DOM_QUOTA_REACHED";
    mock.setItem.mockImplementation(() => {
      throw err;
    });

    expect(checkStorage()).toBe(false);
    expect(getStorageError()).not.toBeNull();
    expect(getStorageError()!.type).toBe("quota_exceeded");
  });

  it("returns false and sets security error on SecurityError", () => {
    const err = new Error("blocked");
    err.name = "SecurityError";
    mock.setItem.mockImplementation(() => {
      throw err;
    });

    expect(checkStorage()).toBe(false);
    const error = getStorageError();
    expect(error!.type).toBe("security");
    expect(error!.message).toBe("blocked");
  });

  it("returns false and sets unavailable error on generic exception", () => {
    const err = new Error("something broke");
    err.name = "NotAllowedError";
    mock.setItem.mockImplementation(() => {
      throw err;
    });

    expect(checkStorage()).toBe(false);
    const error = getStorageError();
    expect(error!.type).toBe("unavailable");
    expect(error!.message).toBe("something broke");
  });

  it("sets unavailable error when storage is disabled (removeItem throws)", () => {
    // setItem succeeds but removeItem throws (e.g. disabled storage)
    const err = new Error("disabled");
    err.name = "NotAllowedError";
    mock.removeItem.mockImplementation(() => {
      throw err;
    });

    expect(checkStorage()).toBe(false);
    expect(getStorageError()!.type).toBe("unavailable");
  });
});

// ── safeGetItem ─────────────────────────────────────────────────

describe("safeGetItem", () => {
  it("returns the stored value on success", () => {
    mock.setItem("foo", "bar");
    expect(safeGetItem("foo")).toBe("bar");
  });

  it("returns null for a missing key", () => {
    expect(safeGetItem("missing")).toBeNull();
  });

  it("returns null without throwing when localStorage.getItem throws", () => {
    vi.spyOn(mock, "getItem").mockImplementation(() => {
      throw new Error("explode");
    });

    expect(safeGetItem("foo")).toBeNull();
    expect(isStorageUnavailable()).toBe(true);
    expect(getStorageError()).not.toBeNull();
  });

  it("returns null when storageState is already unavailable", () => {
    // Force unavailable state
    const err = new Error("blocked");
    err.name = "QuotaExceededError";
    mock.setItem.mockImplementation(() => {
      throw err;
    });
    checkStorage();

    const getItemSpy = vi.spyOn(mock, "getItem");
    expect(safeGetItem("foo")).toBeNull();
    // Should short-circuit — getItem must NOT be called
    expect(getItemSpy).not.toHaveBeenCalled();
    expect(isStorageUnavailable()).toBe(true);
  });
});

// ── safeSetItem ─────────────────────────────────────────────────

describe("safeSetItem", () => {
  it("returns true and writes to localStorage on success", () => {
    expect(safeSetItem("foo", "bar")).toBe(true);
    expect(mock.store.get("foo")).toBe("bar");
  });

  it("returns true and overwrites existing value", () => {
    safeSetItem("foo", "bar");
    expect(safeSetItem("foo", "baz")).toBe(true);
    expect(mock.store.get("foo")).toBe("baz");
  });

  it("returns false without throwing on QuotaExceededError", () => {
    const err = new Error("full");
    err.name = "QuotaExceededError";
    mock.setItem.mockImplementation(() => {
      throw err;
    });

    expect(safeSetItem("foo", "bar")).toBe(false);
    expect(isStorageUnavailable()).toBe(true);
    expect(getStorageError()!.type).toBe("quota_exceeded");
  });

  it("returns false without throwing on SecurityError", () => {
    const err = new Error("blocked");
    err.name = "SecurityError";
    mock.setItem.mockImplementation(() => {
      throw err;
    });

    expect(safeSetItem("foo", "bar")).toBe(false);
    expect(getStorageError()!.type).toBe("security");
  });

  it("returns false without throwing on generic error", () => {
    mock.setItem.mockImplementation(() => {
      throw new Error("unknown");
    });

    expect(safeSetItem("foo", "bar")).toBe(false);
    expect(getStorageError()!.type).toBe("unavailable");
  });

  it("short-circuits and returns false when already unavailable", () => {
    // Set up unavailable state
    const err = new Error("full");
    err.name = "QuotaExceededError";
    mock.setItem.mockImplementation(() => {
      throw err;
    });
    checkStorage();

    // Now restore setItem to a working implementation
    mock.setItem.mockImplementation((key: string, value: string) => {
      mock.store.set(key, value);
    });

    // Clear prior calls from checkStorage so the spy starts fresh
    mock.setItem.mockClear();
    const setItemSpy = vi.spyOn(mock, "setItem");
    expect(safeSetItem("foo", "bar")).toBe(false);
    // Should short-circuit — setItem must NOT be called
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(mock.store.has("foo")).toBe(false);
  });
});

// ── retryStorage ────────────────────────────────────────────────

describe("retryStorage", () => {
  it("returns true and clears error when storage becomes available again", () => {
    // First, break storage
    const err = new Error("full");
    err.name = "QuotaExceededError";
    mock.setItem.mockImplementationOnce(() => {
      throw err;
    });
    checkStorage();
    expect(isStorageUnavailable()).toBe(true);
    expect(getStorageError()).not.toBeNull();

    // Now restore setItem to working
    mock.setItem.mockImplementation((key: string, value: string) => {
      mock.store.set(key, value);
    });

    expect(retryStorage()).toBe(true);
    expect(isStorageUnavailable()).toBe(false);
    expect(getStorageError()).toBeNull();
  });

  it("returns false and keeps error type when storage is still broken", () => {
    const err = new Error("still broken");
    err.name = "QuotaExceededError";
    mock.setItem.mockImplementation(() => {
      throw err;
    });
    checkStorage();

    expect(retryStorage()).toBe(false);
    expect(isStorageUnavailable()).toBe(true);
    const error = getStorageError();
    expect(error).not.toBeNull();
    expect(error!.type).toBe("quota_exceeded");
    expect(error!.message).toBe("still broken");
  });

  it("clears error state before probing (so stale state doesn't mask)", () => {
    // Set up a security error
    const err = new Error("secure");
    err.name = "SecurityError";
    mock.setItem.mockImplementation(() => {
      throw err;
    });
    checkStorage();
    expect(getStorageError()!.type).toBe("security");

    // After retryStorage with still-broken storage, the error message
    // should come from the fresh check, not the stale one
    mock.setItem.mockImplementation(() => {
      throw new Error("fresh failure");
    });
    retryStorage();
    expect(getStorageError()!.message).toBe("fresh failure");
  });
});

// ── clearStorageError ───────────────────────────────────────────

describe("clearStorageError", () => {
  it("resets state to available / no-error", () => {
    const err = new Error("full");
    err.name = "QuotaExceededError";
    mock.setItem.mockImplementation(() => {
      throw err;
    });
    checkStorage();
    expect(isStorageUnavailable()).toBe(true);
    expect(getStorageError()).not.toBeNull();

    clearStorageError();
    expect(isStorageUnavailable()).toBe(false);
    expect(getStorageError()).toBeNull();
  });

  it("is safe to call when no error is set", () => {
    clearStorageError();
    expect(isStorageUnavailable()).toBe(false);
    expect(getStorageError()).toBeNull();
  });
});

// ── getStorageError / isStorageUnavailable ───────────────────────

describe("getStorageError & isStorageUnavailable", () => {
  it("returns null/false on fresh state", () => {
    expect(getStorageError()).toBeNull();
    expect(isStorageUnavailable()).toBe(false);
  });

  it("reports error after a failed setItem", () => {
    const err = new Error("boom");
    err.name = "SecurityError";
    mock.setItem.mockImplementation(() => {
      throw err;
    });

    safeSetItem("x", "y");
    expect(isStorageUnavailable()).toBe(true);
    expect(getStorageError()).toEqual({
      type: "security",
      message: "boom",
    });
  });
});

// ── getStorageErrorKey ──────────────────────────────────────────

describe("getStorageErrorKey", () => {
  it("returns 'unavailable' key when no error is set (default)", () => {
    expect(getStorageErrorKey()).toBe("app.storage.error.unavailable");
  });

  it("returns quota_exceeded key when quota error is active", () => {
    const err = new Error("full");
    err.name = "QuotaExceededError";
    mock.setItem.mockImplementation(() => {
      throw err;
    });
    checkStorage();

    expect(getStorageErrorKey()).toBe("app.storage.error.quota_exceeded");
  });

  it("returns security key when security error is active", () => {
    const err = new Error("denied");
    err.name = "SecurityError";
    mock.setItem.mockImplementation(() => {
      throw err;
    });
    checkStorage();

    expect(getStorageErrorKey()).toBe("app.storage.error.security");
  });

  it("returns unavailable key when generic error is active", () => {
    const err = new Error("broken");
    err.name = "NotAllowedError";
    mock.setItem.mockImplementation(() => {
      throw err;
    });
    checkStorage();

    expect(getStorageErrorKey()).toBe("app.storage.error.unavailable");
  });

  it("returns unavailable key for Firefox quota error (classified as quota_exceeded)", () => {
    const err = new Error("full");
    err.name = "NS_ERROR_DOM_QUOTA_REACHED";
    mock.setItem.mockImplementation(() => {
      throw err;
    });
    checkStorage();

    expect(getStorageErrorKey()).toBe("app.storage.error.quota_exceeded");
  });
});
