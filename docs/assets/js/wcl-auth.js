const CONFIG_STORAGE_KEY = "midnightraid.wcl.clientId";
const TOKEN_STORAGE_KEY = "midnightraid.wcl.token";
const PKCE_STORAGE_KEY = "midnightraid.wcl.pkce";

function createRandomString(length = 64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => chars[value % chars.length]).join("");
}

function toBase64Url(bytes) {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
}

function loadJson(key) {
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function clearJson(key) {
  window.localStorage.removeItem(key);
}

function getCallbackUrl() {
  return new URL("./index.html", window.location.href).toString();
}

export function getStoredClientId(siteConfig) {
  return window.localStorage.getItem(CONFIG_STORAGE_KEY) || siteConfig?.wclClientId || "";
}

export function setStoredClientId(clientId) {
  const value = String(clientId || "").trim();
  if (value) {
    window.localStorage.setItem(CONFIG_STORAGE_KEY, value);
    return;
  }

  window.localStorage.removeItem(CONFIG_STORAGE_KEY);
}

export function getTokenState() {
  const token = loadJson(TOKEN_STORAGE_KEY);
  if (!token) {
    return { isAuthenticated: false, token: null };
  }

  if (token.expiresAt && Date.now() >= token.expiresAt) {
    clearJson(TOKEN_STORAGE_KEY);
    return { isAuthenticated: false, token: null };
  }

  return { isAuthenticated: true, token };
}

export function getAccessToken() {
  const { token } = getTokenState();
  return token?.accessToken || "";
}

export function clearAuthState() {
  clearJson(TOKEN_STORAGE_KEY);
  clearJson(PKCE_STORAGE_KEY);
}

export async function startLogin({ clientId, authorizeUrl, returnTo }) {
  const trimmedClientId = String(clientId || "").trim();
  if (!trimmedClientId) {
    throw new Error("请先填写可用的 WCL Client ID。");
  }

  const codeVerifier = createRandomString(96);
  const codeChallenge = toBase64Url(await sha256(codeVerifier));
  const state = createRandomString(32);
  const callbackUrl = getCallbackUrl();

  saveJson(PKCE_STORAGE_KEY, {
    codeVerifier,
    state,
    callbackUrl,
    returnTo: returnTo || window.location.href
  });

  const url = new URL(authorizeUrl);
  url.searchParams.set("client_id", trimmedClientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);

  window.location.assign(url.toString());
}

export async function completeLoginIfNeeded({ clientId, tokenUrl }) {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    throw new Error(`WCL 授权失败：${error}`);
  }

  if (!code) {
    return { didLogin: false };
  }

  const pkce = loadJson(PKCE_STORAGE_KEY);
  if (!pkce || pkce.state !== state) {
    throw new Error("WCL 授权状态校验失败，请重新登录。");
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      redirect_uri: pkce.callbackUrl,
      code_verifier: pkce.codeVerifier
    })
  });

  if (!response.ok) {
    throw new Error("WCL Token 交换失败，请确认 Client ID 和回调地址配置正确。");
  }

  const token = await response.json();
  saveJson(TOKEN_STORAGE_KEY, {
    accessToken: token.access_token,
    tokenType: token.token_type || "Bearer",
    expiresAt: Date.now() + Math.max((token.expires_in || 0) - 60, 0) * 1000
  });
  clearJson(PKCE_STORAGE_KEY);

  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");
  window.history.replaceState({}, "", url);

  if (pkce.returnTo && pkce.returnTo !== window.location.href) {
    window.location.replace(pkce.returnTo);
    return { didLogin: true, redirected: true };
  }

  return { didLogin: true, redirected: false };
}
