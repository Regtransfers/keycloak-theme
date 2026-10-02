import { describe, expect, it } from "vitest";
import {
    ATTEMPT_LIFETIME_MS,
    RESTART_COOLDOWN_MS,
    claimAutomaticRestart,
    getRestartUrl,
    getSignInStatus,
    getSiteOrigin,
    readCookie,
    takeSnapshot
} from "./signInAwareness";

const LOADED_AT = 1_000_000;
const SOON = LOADED_AT + 5_000;

describe("readCookie", () => {
    it.each([
        ["KEYCLOAK_SESSION=abc", "abc"],
        ["a=1; KEYCLOAK_SESSION=abc; b=2", "abc"],
        ['KEYCLOAK_SESSION="realm/user/session"', "realm/user/session"],
        ["KEYCLOAK_SESSION=a=b", "a=b"],
        ["KEYCLOAK_SESSION=", ""]
    ])("reads %s", (cookies, expected) => {
        expect(readCookie(cookies, "KEYCLOAK_SESSION")).toBe(expected);
    });

    it.each([[""], ["KEYCLOAK_SESSION_LEGACY=abc"], ["XKEYCLOAK_SESSION=abc"], ["KEYCLOAK_SESSION"]])(
        "finds nothing in %s",
        cookies => {
            expect(readCookie(cookies, "KEYCLOAK_SESSION")).toBeNull();
        }
    );
});

describe("getSignInStatus", () => {
    it("waits while nothing has changed", () => {
        const snapshot = takeSnapshot("KC_AUTH_SESSION_HASH=h1", LOADED_AT);

        expect(getSignInStatus(snapshot, "KC_AUTH_SESSION_HASH=h1", SOON)).toBe("waiting");
    });

    it("sees a sign-in when the session cookie appears", () => {
        const snapshot = takeSnapshot("KC_AUTH_SESSION_HASH=h1", LOADED_AT);

        expect(getSignInStatus(snapshot, "KC_AUTH_SESSION_HASH=h1; KEYCLOAK_SESSION=s1", SOON)).toBe(
            "signed-in"
        );
    });

    it("ignores a session cookie that was already there at load", () => {
        const snapshot = takeSnapshot("KEYCLOAK_SESSION=old", LOADED_AT);

        expect(getSignInStatus(snapshot, "KEYCLOAK_SESSION=old", SOON)).toBe("waiting");
    });

    it("sees a sign-in when a leftover session cookie is replaced by a new one", () => {
        const snapshot = takeSnapshot("KEYCLOAK_SESSION=old", LOADED_AT);

        expect(getSignInStatus(snapshot, "KEYCLOAK_SESSION=new", SOON)).toBe("signed-in");
    });

    it("keeps waiting when a leftover session cookie goes away", () => {
        const snapshot = takeSnapshot("KEYCLOAK_SESSION=old", LOADED_AT);

        expect(getSignInStatus(snapshot, "", SOON)).toBe("waiting");
    });

    it("keeps waiting through a sign-in that shows a form first, then sees it complete", () => {
        const snapshot = takeSnapshot("KC_AUTH_SESSION_HASH=h1", LOADED_AT);

        // The link opens in another tab: the attempt cookie is replaced, no session yet.
        expect(getSignInStatus(snapshot, "KC_AUTH_SESSION_HASH=h2", SOON)).toBe("waiting");
        // The attempt cookie is cleared as the sign-in finishes.
        expect(getSignInStatus(snapshot, "", SOON)).toBe("waiting");
        // The form is submitted and the session cookie arrives.
        expect(getSignInStatus(snapshot, "KEYCLOAK_SESSION=s1", SOON + 60_000)).toBe("signed-in");
    });

    it("treats the attempt as gone once the login timeout has passed", () => {
        const snapshot = takeSnapshot("KC_AUTH_SESSION_HASH=h1", LOADED_AT);

        expect(getSignInStatus(snapshot, "KC_AUTH_SESSION_HASH=h1", LOADED_AT + ATTEMPT_LIFETIME_MS - 1)).toBe(
            "waiting"
        );
        expect(getSignInStatus(snapshot, "KC_AUTH_SESSION_HASH=h1", LOADED_AT + ATTEMPT_LIFETIME_MS)).toBe(
            "attempt-gone"
        );
    });

    it("prefers a sign-in over an expired attempt", () => {
        const snapshot = takeSnapshot("", LOADED_AT);

        expect(getSignInStatus(snapshot, "KEYCLOAK_SESSION=s1", LOADED_AT + ATTEMPT_LIFETIME_MS)).toBe(
            "signed-in"
        );
    });
});

describe("getSiteOrigin", () => {
    it.each([
        ["auth.regtransfers.co.uk", "https://www.regtransfers.co.uk"],
        ["keycloak.regtransfers.review", "https://www.regtransfers.review"],
        ["keycloak.regtransfers.dev", "https://www.regtransfers.dev"]
    ])("maps %s to %s", (hostname, expected) => {
        expect(getSiteOrigin(hostname)).toBe(expected);
    });

    it.each([
        ["localhost"],
        ["regtransfers.co.uk"],
        ["auth.example.com"],
        ["auth.notregtransfers.co.uk"],
        ["auth.regtransfers"],
        ["regtransfers.co.uk.example.com"]
    ])("gives nothing for %s", hostname => {
        expect(getSiteOrigin(hostname)).toBeNull();
    });
});

describe("getRestartUrl", () => {
    it("points at the website's sign-in entry point", () => {
        expect(getRestartUrl("auth.regtransfers.co.uk")).toBe(
            "https://www.regtransfers.co.uk/authentication/challenge"
        );
    });

    it("gives nothing off our hosts", () => {
        expect(getRestartUrl("localhost")).toBeNull();
    });
});

describe("claimAutomaticRestart", () => {
    function fakeStorage(initial?: string) {
        const values = new Map<string, string>();
        if (initial !== undefined) {
            values.set("rt:sign-in-restarted-at", initial);
        }
        return {
            values,
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => void values.set(key, value)
        };
    }

    it("allows the first restart and records it", () => {
        const storage = fakeStorage();

        expect(claimAutomaticRestart(storage, LOADED_AT)).toBe(true);
        expect(storage.values.get("rt:sign-in-restarted-at")).toBe(String(LOADED_AT));
    });

    it("refuses a second restart inside the cool-down", () => {
        const storage = fakeStorage();
        claimAutomaticRestart(storage, LOADED_AT);

        expect(claimAutomaticRestart(storage, LOADED_AT + RESTART_COOLDOWN_MS - 1)).toBe(false);
    });

    it("allows a restart again once the cool-down has passed", () => {
        const storage = fakeStorage();
        claimAutomaticRestart(storage, LOADED_AT);

        expect(claimAutomaticRestart(storage, LOADED_AT + RESTART_COOLDOWN_MS)).toBe(true);
    });

    it("ignores a marker that is not a time", () => {
        expect(claimAutomaticRestart(fakeStorage("nonsense"), LOADED_AT)).toBe(true);
    });

    it("refuses when there is no storage", () => {
        expect(claimAutomaticRestart(undefined, LOADED_AT)).toBe(false);
    });

    it("refuses when storage throws", () => {
        const storage = {
            getItem: () => {
                throw new Error("blocked");
            },
            setItem: () => undefined
        };

        expect(claimAutomaticRestart(storage, LOADED_AT)).toBe(false);
    });
});
