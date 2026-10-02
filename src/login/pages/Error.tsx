import { useEffect } from "react";
import type { I18n } from "../i18n";
import { Template } from "../components/Template";
import { DEFAULT_SITE_ORIGIN, claimAutomaticRestartOnce, getRestartUrl, getSiteOrigin } from "../lib/signInAwareness";

type ErrorKcContext = {
    pageId: "error.ftl";
    status?: string;
    message?: {
        summary?: string;
    };
    realm?: {
        displayName?: string;
    };
    url?: {
        loginRestartFlowUrl?: string;
        loginUrl?: string;
    };
};

type Props = {
    kcContext: ErrorKcContext;
    i18n: I18n;
};

export default function Error({ kcContext, i18n }: Props) {
    const isCookieError = kcContext.message?.summary?.toLowerCase().includes("cookie") ?? false;
    const returnUrl = isCookieError
        ? (getSiteOrigin(window.location.hostname) ?? DEFAULT_SITE_ORIGIN)
        : (kcContext.url?.loginRestartFlowUrl ?? kcContext.url?.loginUrl ?? "/");

    // Keycloak reports "cookie not found" when the sign-in attempt a page belonged to no longer exists.
    // In practice that is nearly always an old "Check your email" tab being reloaded after the customer
    // signed in elsewhere or the attempt timed out — not a cookie problem. Rather than a dead end, hand
    // them to the website's sign-in entry point, which sends a signed-in customer straight on and gives
    // anyone else a fresh sign-in page. Once per tab per cool-down, so a browser that really is blocking
    // cookies still gets to see the message below.
    const restartUrl = getRestartUrl(window.location.hostname);
    const isRestarting = isCookieError && restartUrl !== null && claimAutomaticRestartOnce();

    useEffect(() => {
        if (isRestarting && restartUrl !== null) {
            window.location.replace(restartUrl);
        }
    }, [isRestarting, restartUrl]);

    if (isRestarting && restartUrl !== null) {
        return (
            <Template
                kcContext={kcContext as never}
                i18n={i18n}
                headerNode={<p className="kc-display-heading font-bold font-[Roboto]">One moment</p>}
                displayMessage={false}
                displayInfo={false}
            >
                <p className="text-sm text-white/80 leading-6">Taking you back to sign in.</p>

                <div className="border-t border-white/20 pt-4 text-center mt-6">
                    <a href={restartUrl} className="text-sm text-white/70 underline underline-offset-4 hover:text-white">
                        Continue
                    </a>
                </div>
            </Template>
        );
    }

    return (
        <Template
            kcContext={kcContext as never}
            i18n={i18n}
            headerNode={<p className="kc-display-heading font-bold font-[Roboto]">Error</p>}
            displayMessage={false}
            displayInfo={false}
        >
            <p className="text-sm text-white/80 leading-6">We are sorry, but an error has occurred.</p>

            {kcContext.message?.summary && (
                <p className="text-sm text-red-400 leading-6 mt-3">{kcContext.message.summary}</p>
            )}

            <div className="border-t border-white/20 pt-4 text-center mt-6">
                <a
                    href={returnUrl}
                    className="text-sm text-white/70 underline underline-offset-4 hover:text-white"
                >
                    {isCookieError ? "Return to Regtransfers" : "Return to sign in"}
                </a>
            </div>
        </Template>
    );
}
