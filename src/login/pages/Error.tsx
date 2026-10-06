import type { I18n } from "../i18n";
import { Template } from "../components/Template";

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
    const isCookieError = kcContext.message?.summary?.toLowerCase().includes("cookie");
    const returnUrl = isCookieError
        ? "https://www.regtransfers.co.uk"
        : (kcContext.url?.loginRestartFlowUrl ?? kcContext.url?.loginUrl ?? "/");

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
