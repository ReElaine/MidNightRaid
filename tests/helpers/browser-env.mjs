import { webcrypto } from "node:crypto";

export function createLocation(url = "https://example.com/docs/index.html") {
  const current = new URL(url);

  return {
    get href() {
      return current.toString();
    },
    set href(value) {
      const next = new URL(value, current);
      current.href = next.href;
    },
    get search() {
      return current.search;
    },
    set search(value) {
      current.search = value;
    },
    get pathname() {
      return current.pathname;
    },
    set pathname(value) {
      current.pathname = value;
    },
    assign(value) {
      this.href = value;
    },
    replace(value) {
      this.href = value;
    },
    toString() {
      return current.toString();
    }
  };
}

export function createStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    }
  };
}

export function installBrowserGlobals({
  url = "https://example.com/docs/index.html",
  bodyDataset = {},
  fetchImpl = null
} = {}) {
  const location = createLocation(url);
  const localStorage = createStorage();
  const historyCalls = [];

  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, "crypto", {
      value: webcrypto,
      configurable: true
    });
  }
  globalThis.btoa = globalThis.btoa || ((value) => Buffer.from(value, "binary").toString("base64"));
  globalThis.window = {
    location,
    localStorage,
    history: {
      replaceState(_state, _title, nextUrl) {
        historyCalls.push(String(nextUrl));
        location.href = String(nextUrl);
      }
    }
  };
  globalThis.document = {
    body: {
      dataset: bodyDataset
    },
    querySelector() {
      return null;
    }
  };

  if (fetchImpl) {
    globalThis.fetch = fetchImpl;
  }

  return {
    location,
    localStorage,
    historyCalls
  };
}

export function cleanupBrowserGlobals() {
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.fetch;
}
