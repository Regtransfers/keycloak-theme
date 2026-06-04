import { useEffect } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Template } from "../components/Template";

const RELOAD_DELAY_MS = 5000;

type ViewEmailContinuationKcContext = Extract<KcContext, { pageId: "view-email-continuation.ftl" }>;

type Props = {
    kcContext: ViewEmailContinuationKcContext;
    i18n: I18n;
};

export default function ViewEmailContinuation({ kcContext, i18n }: Props) {
    const { msg } = i18n;
    const { auth, url, pollingUrl } = kcContext;

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const poll = async () => {
            if (!pollingUrl) {
                timeoutId = setTimeout(() => window.location.reload(), RELOAD_DELAY_MS);
                return;
            }

            try {
                const response = await fetch(pollingUrl, {
                    cache: "no-store",
                    credentials: "same-origin"
                });

                if (!response.ok) {
                    timeoutId = setTimeout(poll, RELOAD_DELAY_MS);
                    return;
                }

                const data = (await response.json()) as { state?: string };

                if (data.state === "confirmed") {
                    window.location.href = url.loginAction;
                    return;
                }

                timeoutId = setTimeout(poll, RELOAD_DELAY_MS);
            } catch {
                timeoutId = setTimeout(poll, RELOAD_DELAY_MS);
            }
        };

        timeoutId = setTimeout(poll, RELOAD_DELAY_MS);

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [pollingUrl, url.loginAction]);

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={
                <>
                    <p className="kc-display-heading font-bold font-[Roboto]">Waiting for confirmation</p>
                    <h1 className="text-[0.9375rem] font-normal text-white/80 mt-1 font-[Arimo]">
                        {auth.attemptedUsername}
                    </h1>
                </>
            }
            displayMessage={false}
            displayInfo={false}
        >
            <div className="flex flex-col gap-4">
                <p className="text-sm text-white/80 leading-6">{msg("magicLinkContinuationConfirmation")}</p>
                <a
                    href={url.loginRestartFlowUrl}
                    className="text-center text-sm text-white/70 underline underline-offset-4 hover:text-white"
                >
                    Try another way
                </a>
            </div>
        </Template>
    );
}
