import { useEffect, useRef, useState } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Template } from "../components/Template";

/** How often to ask the server whether the email has been verified yet. */
const POLL_INTERVAL_MS = 5000;

type LoginVerifyEmailKcContext = Extract<KcContext, { pageId: "login-verify-email.ftl" }>;

type Props = {
    kcContext: LoginVerifyEmailKcContext;
    i18n: I18n;
};

/**
 * Build the URL of our custom realm resource:
 *   GET /realms/{realm}/verify-email-status?client_id=..&tab_id=..
 * Returns undefined if we can't derive the params (then we just stay static).
 */
function buildStatusUrl(): string | undefined {
    if (typeof window === "undefined") {
        return undefined;
    }

    const params = new URLSearchParams(window.location.search);
    const clientId = params.get("client_id");
    const tabId = params.get("tab_id");
    const realm = window.location.pathname.match(/\/realms\/([^/]+)\//)?.[1];

    if (!clientId || !tabId || !realm) {
        return undefined;
    }

    const query = new URLSearchParams({ client_id: clientId, tab_id: tabId });
    return `${window.location.origin}/realms/${encodeURIComponent(realm)}/verify-email/status?${query.toString()}`;
}

export default function LoginVerifyEmail({ kcContext, i18n }: Props) {
    const { url } = kcContext;
    const signInUrl = url.loginRestartFlowUrl ?? url.loginUrl;
    const forceVerifiedState = kcContext.storybook?.forceVerifiedState === true;

    const [verified, setVerified] = useState(forceVerifiedState);
    // Realm-signed token the server hands back on the first poll; lets later
    // polls keep checking after the auth session is gone (same-browser verify).
    const tokenRef = useRef<string | null>(null);

    useEffect(() => {
        if (verified || forceVerifiedState) {
            return;
        }

        const statusUrl = buildStatusUrl();
        if (statusUrl === undefined) {
            return;
        }

        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        let cancelled = false;

        const poll = async () => {
            try {
                const requestUrl = new URL(statusUrl);
                if (tokenRef.current !== null) {
                    requestUrl.searchParams.set("token", tokenRef.current);
                }

                const response = await fetch(requestUrl.toString(), {
                    cache: "no-store",
                    credentials: "same-origin",
                    headers: { Accept: "application/json" }
                });

                if (cancelled) return;

                if (response.ok) {
                    const data = (await response.json()) as { verified?: boolean; token?: string };
                    if (typeof data.token === "string") {
                        tokenRef.current = data.token;
                    }
                    if (data.verified === true) {
                        setVerified(true);
                        return;
                    }
                }
            } catch {
                // Network blip — try again on the next tick.
            }

            if (!cancelled) {
                timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
            }
        };

        timeoutId = setTimeout(poll, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [verified, forceVerifiedState]);

    if (verified) {
        return (
            <Template
                kcContext={kcContext as never}
                i18n={i18n}
                headerNode={<p className="kc-display-heading font-bold font-[Roboto] text-center">Email verified</p>}
                displayMessage={false}
                displayInfo={false}
            >
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1b9a38]/20">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#1b9a38"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-6 w-6"
                            aria-hidden="true"
                        >
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                    </div>
                    <p className="text-base text-white leading-6">
                        Your email address has been verified.
                    </p>
                    <p className="text-sm text-white/70 leading-6">
                        It is safe to close this window.
                    </p>
                </div>
            </Template>
        );
    }

    return (
        <Template
            kcContext={kcContext as never}
            i18n={i18n}
            headerNode={<p className="kc-display-heading font-bold font-[Roboto]">Email verification</p>}
            displayMessage
            displayInfo={false}
        >
            <div className="flex flex-col gap-4">
                <p className="text-sm text-white/80 leading-6">
                    You need to verify your email address to activate your account.
                </p>

                <p className="text-sm text-white/80 leading-6">
                    An email with instructions has been sent to your inbox. Unable to find the email? Check your spam/junk folder. If you still can&apos;t find it, click the button below.
                </p>

                <p className="text-sm text-white/60 leading-6" aria-live="polite">
                    Waiting for you to verify your email — this page updates automatically.
                </p>

                <div className="flex flex-col gap-3 mt-3 mb-0">
                    <form action={url.loginAction} method="post">
                        <Button
                            type="submit"
                            id="kc-resend"
                            name="resend"
                            size="lg"
                            className="w-full border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d]"
                        >
                            Re-send verification email
                        </Button>
                    </form>
                </div>

                {signInUrl ? (
                    <div className="border-t border-white/20 pt-4 text-center">
                        <a
                            href={signInUrl}
                            className="text-sm text-white/70 underline underline-offset-4 hover:text-white"
                        >
                            Back to sign in
                        </a>
                    </div>
                ) : null}
            </div>
        </Template>
    );
}
