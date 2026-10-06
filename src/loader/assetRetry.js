/*
 * Asset retry loader.
 *
 * vite.config.ts copies this file, verbatim, into a script tag at the top of the page head, so it
 * is in every page template the build generates and runs before the bundle and the stylesheet are
 * requested. If either of them fails to load it asks for it again at a new address. Background and
 * the reasoning behind every number below: docs/asset-loading.md.
 *
 * Rules for this file (assetRetry.test.ts enforces them):
 *  - ES5 syntax, no imports: nothing else has loaded yet.
 *  - It ends up inside a FreeMarker template and an HTML script element, and Keycloak and the build
 *    tools search that text. So no template strings, no dollar or percent signs, no hash-brace, no
 *    angle bracket followed by hash, at-sign, slash or exclamation mark, no doubled braces, no
 *    non-ASCII characters and no quoted asset paths. Build strings by concatenation.
 *  - It only ever reacts to an error event, and it waits for one attempt to fail before starting
 *    the next. That is what guarantees the bundle cannot run twice.
 */
/* eslint-disable @typescript-eslint/no-unused-vars -- ES5 has no optional catch binding */
(function () {
    "use strict";

    var w = window;
    var d = document;

    // A second copy in the same document must not double every retry.
    if (w.__rtAssetRetry) {
        return;
    }
    w.__rtAssetRetry = 1;

    var PARAM = "kcr";
    var STORE_PREFIX = "rt-theme-asset:";
    // Delay before each of the first attempts, in ms: six tries in about 10.6 s.
    var QUICK = [0, 300, 800, 1500, 3000, 5000];
    // After those, keep trying quietly. The last delay repeats.
    var SLOW = [8000, 10000, 15000, 20000];
    // Stop this long after the first failure (ms). Long enough for a rolling restart of the
    // servers plus the few minutes an edge cache holds on to a "not found".
    var GIVE_UP_AFTER = 360000;
    // Show the notice if the page has not started this long after this script ran (ms).
    var WATCHDOG = 20000;

    var chains = {};
    var sequence = 0;
    // The text node of the notice's second line, once the notice is up.
    var noticeText = null;

    function now() {
        return new Date().getTime();
    }

    function localStore() {
        try {
            return w.localStorage || null;
        } catch (e) {
            // Site data blocked: work without a memory.
            return null;
        }
    }

    function validToken(token) {
        return typeof token === "string" && token.length > 0 && token.length < 41 && !/[^a-z0-9-]/.test(token);
    }

    // The token this browser last loaded this exact file with, if any.
    function recall(kind, file) {
        try {
            var store = localStore();
            var value = store ? store.getItem(STORE_PREFIX + kind) : null;
            if (!value) {
                return null;
            }
            var cut = value.lastIndexOf("|");
            if (cut < 1 || value.slice(0, cut) !== file) {
                return null;
            }
            var token = value.slice(cut + 1);
            return validToken(token) ? token : null;
        } catch (e) {
            return null;
        }
    }

    function remember(kind, file, token) {
        try {
            var store = localStore();
            if (store) {
                store.setItem(STORE_PREFIX + kind, file + "|" + token);
            }
        } catch (e) {
            // Storage full or blocked: nothing to do.
        }
    }

    function forget(kind) {
        try {
            var store = localStore();
            if (store) {
                store.removeItem(STORE_PREFIX + kind);
            }
        } catch (e) {
            // As above.
        }
    }

    function freshToken(attempt) {
        sequence += 1;
        var random = Math.random().toString(36).slice(2, 6);
        return attempt + "-" + now().toString(36) + sequence.toString(36) + random;
    }

    function parse(address) {
        try {
            return new URL(address, d.baseURI);
        } catch (e) {
            return null;
        }
    }

    function hasWord(list, word) {
        return (" " + String(list || "").toLowerCase() + " ").indexOf(" " + word + " ") !== -1;
    }

    // Describes the element if it is this theme's bundle or stylesheet, otherwise null.
    function describe(el) {
        if (!el || el === w || !el.tagName || !el.getAttribute) {
            return null;
        }
        var tag = String(el.tagName).toUpperCase();
        var kind = null;
        var raw = null;
        if (tag === "SCRIPT" && el.getAttribute("type") === "module") {
            kind = "script";
            raw = el.src;
        } else if (tag === "LINK" && hasWord(el.getAttribute("rel"), "stylesheet")) {
            kind = "style";
            raw = el.href;
        }
        if (!kind || !raw) {
            return null;
        }
        var url = parse(raw);
        // Only this theme's own built files: same origin, in an "assets" directory.
        if (!url || url.origin !== w.location.origin || url.pathname.indexOf("/assets/") === -1) {
            return null;
        }
        var base = new URL(url.href);
        base.searchParams["delete"](PARAM);
        base.hash = "";
        var parts = base.pathname.split("/");
        return { kind: kind, base: base.href, file: parts[parts.length - 1] };
    }

    function withToken(base, token) {
        var url = new URL(base);
        url.searchParams.set(PARAM, token);
        return url.href;
    }

    function reload() {
        // replace() issues a GET, so a page that was the answer to a form post is not posted
        // again. Without its fragment, because "navigating" to the same address with a fragment
        // makes no request at all.
        w.location.replace(String(w.location.href).split("#")[0]);
    }

    function stillTrying() {
        for (var base in chains) {
            if (Object.prototype.hasOwnProperty.call(chains, base) && !chains[base].done) {
                return true;
            }
        }
        return false;
    }

    // Say "still trying" only while that is true.
    function refreshNotice() {
        if (noticeText) {
            noticeText.nodeValue = stillTrying()
                ? "We are still trying. You can wait, or use the button to load it again."
                : "Use the button to load it again.";
        }
    }

    function showNotice() {
        if (w.__rtThemeBooted || d.querySelector("[data-rt-asset-notice]")) {
            return;
        }
        var root = d.getElementById("root");
        if (root && root.firstChild) {
            return;
        }
        var host = root || d.body;
        if (!host) {
            return;
        }
        // Styled entirely inline: the stylesheet may be the thing that is missing, and when it is
        // present its colours must not make this unreadable.
        var box = d.createElement("div");
        box.setAttribute("data-rt-asset-notice", "");
        box.setAttribute("role", "alert");
        box.style.cssText =
            "box-sizing:border-box;max-width:28rem;margin:15vh auto 0;padding:1.5rem;text-align:center;" +
            "border:1px solid #d1d5db;border-radius:.5rem;background:#ffffff;color:#111827;" +
            "font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif";
        var title = d.createElement("p");
        title.style.cssText = "margin:0 0 .5rem;font-size:1.25rem;font-weight:600;color:#111827";
        title.appendChild(d.createTextNode("This page is taking longer than usual to load"));
        var text = d.createElement("p");
        text.style.cssText = "margin:0 0 1.25rem;color:#374151";
        noticeText = d.createTextNode("");
        text.appendChild(noticeText);
        refreshNotice();
        var button = d.createElement("button");
        button.type = "button";
        button.style.cssText =
            "display:inline-block;padding:.6rem 1.25rem;border:1px solid #111827;border-radius:.375rem;" +
            "background:#111827;color:#ffffff;font:inherit;font-weight:600;cursor:pointer";
        button.appendChild(d.createTextNode("Try again"));
        button.addEventListener("click", reload);
        box.appendChild(title);
        box.appendChild(text);
        box.appendChild(button);
        host.appendChild(box);
    }

    function attempt(chain) {
        if (chain.kind === "script" && w.__rtThemeBooted) {
            chain.done = true;
            return;
        }
        chain.attempts += 1;

        // First try: the address this browser last loaded this file from, if it has one. A browser
        // that holds a cached "not found" for the plain address then goes straight to an address it
        // has cached as good. After that, a new address every time: a failed address is never
        // asked for twice, because it may now be cached as "not found" as well.
        var remembered = chain.attempts === 1 ? recall(chain.kind, chain.file) : null;
        var token = remembered || freshToken(chain.attempts);
        chain.usedRemembered = !!remembered;

        // Always a newly created element. A copy of a script element that has already run or
        // failed is never fetched.
        var next = d.createElement(chain.kind === "script" ? "script" : "link");
        if (chain.kind === "script") {
            next.type = "module";
        } else {
            next.rel = "stylesheet";
        }
        if (chain.crossOrigin !== null) {
            next.setAttribute("crossorigin", chain.crossOrigin);
        }
        if (chain.nonce) {
            next.setAttribute("nonce", chain.nonce);
        }
        next.setAttribute("data-rt-asset-retry", String(chain.attempts));
        next.addEventListener(
            "load",
            guarded(function () {
                chain.done = true;
                chain.current = null;
                // A script fires "load" even when what came back does not parse or is not this
                // bundle. Remember an address only if the page actually started from it; otherwise
                // a bad copy in the browser cache would be reused on every visit.
                if (chain.kind === "script" && !w.__rtThemeBooted) {
                    if (chain.usedRemembered) {
                        forget(chain.kind);
                    }
                } else {
                    remember(chain.kind, chain.file, token);
                }
                refreshNotice();
            })
        );
        chain.current = next;
        if (chain.kind === "script") {
            next.src = withToken(chain.base, token);
        } else {
            next.href = withToken(chain.base, token);
        }

        // In the place of the element that failed, so the stylesheet keeps its position in the
        // cascade.
        var after = chain.after;
        if (after && after.parentNode) {
            after.parentNode.insertBefore(next, after.nextSibling);
        } else {
            (d.head || d.documentElement).appendChild(next);
        }
        chain.after = next;
    }

    function schedule(chain) {
        var made = chain.attempts;
        var delay;
        if (made < QUICK.length) {
            delay = QUICK[made];
        } else {
            if (chain.kind === "script") {
                showNotice();
            }
            if (now() - chain.startedAt > GIVE_UP_AFTER) {
                chain.done = true;
                chain.stopped = true;
                return;
            }
            var slow = made - QUICK.length;
            delay = SLOW[slow < SLOW.length ? slow : SLOW.length - 1];
        }
        chain.fire = function () {
            chain.timer = null;
            chain.fire = null;
            attempt(chain);
        };
        chain.timer = w.setTimeout(chain.fire, delay);
    }

    function onError(event) {
        var el = event && event.target;
        var info = describe(el);
        if (!info) {
            return;
        }
        var chain = chains[info.base];
        if (!chain) {
            chain = chains[info.base] = {
                kind: info.kind,
                base: info.base,
                file: info.file,
                crossOrigin: el.getAttribute("crossorigin"),
                nonce: el.nonce || el.getAttribute("nonce") || "",
                attempts: 0,
                startedAt: now(),
                after: el,
                current: null,
                usedRemembered: false,
                timer: null,
                fire: null,
                done: false,
                stopped: false
            };
        } else if (chain.done || chain.current !== el) {
            // Not the attempt this chain is waiting for (a second tag for the same file, say).
            // One attempt at a time, always.
            return;
        } else {
            chain.current = null;
            if (chain.usedRemembered) {
                forget(chain.kind);
            }
        }
        schedule(chain);
        refreshNotice();
    }

    // When the connection or the tab comes back: bring a waiting attempt forward, and give a file
    // the loader had stopped trying another six minutes (a laptop that slept through the first six
    // wakes up here). It never starts a second attempt alongside one that is in flight: a stopped
    // chain has none, and a waiting one is fired through its own timer.
    function hurry() {
        for (var base in chains) {
            if (Object.prototype.hasOwnProperty.call(chains, base)) {
                var chain = chains[base];
                if (chain.stopped) {
                    chain.stopped = false;
                    chain.done = false;
                    chain.startedAt = now();
                    attempt(chain);
                } else if (!chain.done && chain.timer !== null && chain.fire) {
                    w.clearTimeout(chain.timer);
                    chain.fire();
                }
            }
        }
        refreshNotice();
    }

    function guarded(fn) {
        return function (event) {
            try {
                fn(event);
            } catch (e) {
                // The safety net must never be the thing that throws.
            }
        };
    }

    // Error events from elements do not bubble, but they can be captured on the way down.
    w.addEventListener("error", guarded(onError), true);
    w.addEventListener("online", guarded(hurry));
    d.addEventListener(
        "visibilitychange",
        guarded(function () {
            if (d.visibilityState === "visible") {
                hurry();
            }
        })
    );

    // Backstop for the cases where no error event arrives at all (a request that hangs, a blocker
    // that swallows the event). It fetches nothing, so it cannot cause a second run. It counts from
    // now, not from DOMContentLoaded: a module script that is still downloading holds
    // DOMContentLoaded back, so a request that hangs would never start the clock.
    w.setTimeout(guarded(showNotice), WATCHDOG);
})();
