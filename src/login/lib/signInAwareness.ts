import { useEffect } from "react";

/**
 * Lets a sign-in page notice what has happened to the sign-in since it was rendered, instead of sitting
 * there until the customer reloads it into an error.
 *
 * Two cookies Keycloak sets without HttpOnly (so its own base theme can do the same job in
 * `authChecker.js`, which our custom Template does not load) are enough:
 *
 *  - KEYCLOAK_SESSION appears in this browser when a sign-in completes, e.g. the customer clicked the
 *    magic link and it opened in another tab.
 *  - KC_AUTH_SESSION_HASH identifies the sign-in attempt the browser currently holds. If it no longer
 *    matches the one this page was rendered for, the attempt this page belongs to is gone.
 *
 * A sign-in completed in a different browser or device is invisible from here — neither cookie changes.
 */
export const SESSION_COOKIE = "KEYCLOAK_SESSION";
export const AUTH_SESSION_HASH_COOKIE = "KC_AUTH_SESSION_HASH";

/** How often an open page checks. Same interval as Keycloak's own authChecker. */
export const CHECK_INTERVAL_MS = 2000;

/**
 * How long a sign-in attempt lives: the Customers realm's "Login timeout" (30 minutes). A page older than
 * this is dead even though no cookie has changed. If the realm setting is ever shortened the only effect
 * is that the restart happens a little late; the error page still catches it.
 */
export const ATTEMPT_LIFETIME_MS = 30 * 60 * 1000;

export type SignInStatus =
  /** Nothing has changed; keep waiting. */
  | "waiting"
  /** The customer has signed in, in this browser. */
  | "signed-in"
  /** The sign-in attempt this page was rendered for no longer exists. */
  | "attempt-gone";

export type PageSnapshot = {
  /** KEYCLOAK_SESSION was already there when the page loaded. */
  hadSessionAtLoad: boolean;
  /** KC_AUTH_SESSION_HASH was there when the page loaded. */
  hadAuthSessionHashAtLoad: boolean;
  /** The attempt this page was rendered for (`authenticationSession.authSessionIdHash`), when known. */
  pageAuthSessionHash?: string;
  /** `Date.now()` when the page loaded. */
  loadedAtMs: number;
};

export function readCookie(cookieString: string, name: string): string | null {
  for (const cookie of cookieString.split(";")) {
    const separator = cookie.indexOf("=");
    if (separator < 0) {
      continue;
    }
    if (cookie.slice(0, separator).trim() !== name) {
      continue;
    }
    const value = cookie.slice(separator + 1).trim();
    return value.startsWith('"') && value.endsWith('"')
      ? value.slice(1, -1)
      : value;
  }
  return null;
}

export function takeSnapshot(
  cookieString: string,
  pageAuthSessionHash: string | undefined,
  nowMs: number,
): PageSnapshot {
  return {
    hadSessionAtLoad: readCookie(cookieString, SESSION_COOKIE) !== null,
    hadAuthSessionHashAtLoad:
      readCookie(cookieString, AUTH_SESSION_HASH_COOKIE) !== null,
    pageAuthSessionHash,
    loadedAtMs: nowMs,
  };
}

/**
 * Decides what has happened since the page loaded. Pure, so the rules can be reasoned about (and tested)
 * without a browser.
 */
export function getSignInStatus(
  snapshot: PageSnapshot,
  cookieString: string,
  nowMs: number,
): SignInStatus {
  // A session that was already there at load proves nothing (its cookie outlives an idle session on
  // the server), and acting on it would bounce the customer between this page and Keycloak. Keycloak's
  // own checker makes the same exception.
  if (
    !snapshot.hadSessionAtLoad &&
    readCookie(cookieString, SESSION_COOKIE) !== null
  ) {
    return "signed-in";
  }

  const currentHash = readCookie(cookieString, AUTH_SESSION_HASH_COOKIE);

  // A different attempt has replaced this page's one in this browser.
  if (
    snapshot.pageAuthSessionHash !== undefined &&
    currentHash !== null &&
    currentHash !== snapshot.pageAuthSessionHash
  ) {
    return "attempt-gone";
  }

  // The attempt's cookie was here and has gone. Only trusted when we saw it at load: a Keycloak that
  // never sets it must not look like a vanished attempt.
  if (snapshot.hadAuthSessionHashAtLoad && currentHash === null) {
    return "attempt-gone";
  }

  if (nowMs - snapshot.loadedAtMs >= ATTEMPT_LIFETIME_MS) {
    return "attempt-gone";
  }

  return "waiting";
}

/** Used for plain links when the page is not on one of our Keycloak hosts (Storybook, local dev). */
export const DEFAULT_SITE_ORIGIN = "https://www.regtransfers.co.uk";

/**
 * The public website for the Keycloak host this page is served from: "www" in place of the first label
 * (auth.regtransfers.co.uk, keycloak.regtransfers.review and keycloak.regtransfers.dev all follow this).
 * Null for any other host, such as Storybook on localhost, so nothing redirects by itself from there.
 */
export function getSiteOrigin(hostname: string): string | null {
  const labels = hostname.split(".");
  if (
    labels.length < 3 ||
    !labels.slice(1).join(".").startsWith("regtransfers.")
  ) {
    return null;
  }
  return `https://www.${labels.slice(1).join(".")}`;
}

/**
 * Where to send a customer whose sign-in attempt is gone: the website's sign-in entry point. It already
 * does the right thing for both cases — someone signed in is sent straight on, anyone else gets a fresh
 * sign-in page — which is why this does not try to guess which one the customer is. Null when the site
 * cannot be derived from the host.
 */
export function getRestartUrl(hostname: string): string | null {
  const origin = getSiteOrigin(hostname);
  return origin === null ? null : `${origin}/authentication/challenge`;
}

type Options = {
  /** `kcContext.url.ssoLoginInOtherTabsUrl`: finishes THIS tab's sign-in using the session another tab created. */
  signedInUrl?: string;
  /** `kcContext.authenticationSession?.authSessionIdHash`. */
  pageAuthSessionHash?: string;
};

/**
 * Watches for the sign-in completing, or the attempt expiring, while the page is open, and moves the
 * customer on. Runs in a background tab too, as Keycloak's own checker does: that is where this page
 * normally is when the link opens in a new tab, so it is already where the customer was going by the
 * time they look at it. Also checks the moment the tab is shown again, because phones suspend timers in
 * background tabs and a page restored from the back/forward cache never re-runs its scripts.
 */
export function useSignInAwareness({
  signedInUrl,
  pageAuthSessionHash,
}: Options): void {
  useEffect(() => {
    const snapshot = takeSnapshot(
      document.cookie,
      pageAuthSessionHash,
      Date.now(),
    );
    let stopped = false;

    const stop = () => {
      stopped = true;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("pageshow", check);
      document.removeEventListener("submit", stop, true);
    };

    function check() {
      if (stopped) {
        return;
      }

      const status = getSignInStatus(snapshot, document.cookie, Date.now());
      if (status === "waiting") {
        return;
      }

      stop();
      const destination =
        status === "signed-in" && signedInUrl
          ? signedInUrl
          : getRestartUrl(window.location.hostname);
      if (destination !== null) {
        window.location.replace(destination);
      }
    }

    const intervalId = setInterval(check, CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("pageshow", check);
    // A form the customer submits (Resend) must not race a redirect. Safari does not fire
    // beforeunload reliably, so this is the same guard Keycloak's checker uses.
    document.addEventListener("submit", stop, true);

    return stop;
  }, [signedInUrl, pageAuthSessionHash]);
}

const RESTART_MARKER_KEY = "rt:sign-in-restarted-at";

/** A second dead-attempt error this soon after an automatic restart means restarting is not helping. */
export const RESTART_COOLDOWN_MS = 2 * 60 * 1000;

type MarkerStorage = Pick<Storage, "getItem" | "setItem">;

/**
 * Whether the error page may restart sign-in by itself, claiming the right to if so. Allowed once per
 * cool-down per tab: a customer whose browser really is refusing cookies would otherwise be sent round
 * again on every attempt and never see the message telling them so. No storage (private modes that
 * block it) means no automatic restart — the page and its link are shown instead.
 */
export function claimAutomaticRestart(
  storage: MarkerStorage | undefined,
  nowMs: number,
): boolean {
  if (storage === undefined) {
    return false;
  }

  try {
    const previous = Number(storage.getItem(RESTART_MARKER_KEY));
    if (
      Number.isFinite(previous) &&
      previous > 0 &&
      nowMs - previous < RESTART_COOLDOWN_MS
    ) {
      return false;
    }
    storage.setItem(RESTART_MARKER_KEY, String(nowMs));
    return true;
  } catch {
    return false;
  }
}

/** sessionStorage, or undefined where the browser blocks access to it. */
export function getTabStorage(): MarkerStorage | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

let automaticRestartClaim: boolean | undefined;

/**
 * {@link claimAutomaticRestart} decided once per page load. Claiming writes the marker, so asking twice
 * (React renders twice in development) would otherwise see its own first answer as "just restarted".
 */
export function claimAutomaticRestartOnce(): boolean {
  automaticRestartClaim ??= claimAutomaticRestart(getTabStorage(), Date.now());
  return automaticRestartClaim;
}
