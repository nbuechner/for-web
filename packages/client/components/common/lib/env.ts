export const STOAT_HOST = "stoat.chat";
export const STOAT_API = "https://api.stoat.chat";

/** App `stoat.json` endpoint format */
export interface AppConfig {
  api: string;
}

/**
 * Fetch env var by name, optionally only when in dev mode.
 * Also prevents compiler from optimizing out injected strings in Docker
 */
const getEnv = (name: string, devOnly?: boolean) =>
  !devOnly || import.meta.env.DEV
    ? (import.meta.env[name] as string)
    : undefined;

const INJECTED_HOST = getEnv("VITE_DEV_HOST", true) || getEnv("VITE_HOST");
const inBrowser = typeof window !== "undefined";

/**
 * A self-hosted build bakes one absolute default-domain URL into the bundle
 * at container start (see docker/inject.js). That's only correct when the
 * page is loaded from that exact domain - an operator can also mirror the
 * instance onto additional custom domains (Caddy proxies identical relative
 * routes on every one of them), and in that case every request needs to stay
 * on the domain the page actually loaded from instead of silently crossing
 * over to the original one. Deriving from window.location does that, and is
 * a no-op on the primary domain since the two already match there.
 */
const useSameOrigin = Boolean(INJECTED_HOST) && inBrowser;

const DEFAULT_HOST = useSameOrigin
  ? window.location.host
  : INJECTED_HOST || STOAT_HOST;

const DEFAULT_API_URL =
  getEnv("VITE_DEV_API_URL", true) ||
  (useSameOrigin ? `${window.location.origin}/api` : getEnv("VITE_API_URL")) ||
  STOAT_API;

if (DEFAULT_API_URL !== STOAT_API && DEFAULT_HOST === STOAT_HOST)
  throw "VITE_HOST required when VITE_API_URL is set!";

const wsOrigin = () =>
  (window.location.protocol === "https:" ? "wss:" : "ws:") +
  `//${window.location.host}`;

export default {
  /** Default instance (without the protocol) */
  DEFAULT_HOST,
  /** API URL of default instance */
  DEFAULT_API_URL,
  /** WS server override for development */
  DEV_WS_URL: useSameOrigin ? `${wsOrigin()}/ws` : getEnv("VITE_DEV_WS_URL"),
  /** Media server override for development */
  DEV_MEDIA_URL: useSameOrigin
    ? `${window.location.origin}/autumn`
    : getEnv("VITE_DEV_MEDIA_URL"),
  /** Proxy server override for development */
  DEV_PROXY_URL: useSameOrigin
    ? `${window.location.origin}/january`
    : getEnv("VITE_DEV_PROXY_URL"),
  /** Gifbox server override for development */
  DEV_GIFBOX_URL: useSameOrigin
    ? `${window.location.origin}/gifbox`
    : getEnv("VITE_DEV_GIFBOX_URL"),
  /**
   * RNNoise worklet CDN host location. Defaults to blank, which uses the url provided by the livekit-rnnoise-processor package.
   */
  RNNOISE_WORKLET_CDN_URL: getEnv("VITE_RNNOISE_WORKLET_CDN_URL"),
  /**
   * Session ID to set during development.
   */
  DEVELOPMENT_SESSION_ID: getEnv("VITE_SESSION_ID", true),
  /**
   * Token to set during development.
   */
  DEVELOPMENT_TOKEN: getEnv("VITE_TOKEN", true),
  /**
   * User ID to set during development.
   */
  DEVELOPMENT_USER_ID: getEnv("VITE_USER_ID", true),
};
