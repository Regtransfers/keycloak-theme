import type { I18n } from "../i18n";
import { Template } from "../components/Template";

type ErrorKcContext = {
    pageId: "error.ftl";
    status?: string;
    message?: {
        summary?: string;
    };
    // Handle various error message formats
    realm?: {
        displayName?: string;
    };
};

type Props = {
    kcContext: ErrorKcContext;
    i18n: I18n;
};

export default function Error({ kcContext, i18n }: Props) {
    return (
        <Template
            kcContext={kcContext as never}
            i18n={i18n}
            headerNode={<p className="kc-display-heading font-bold font-[Roboto]">Error</p>}
            displayMessage={true}
            displayInfo={false}
        >
            {kcContext.message?.summary && (
                <p className="text-sm text-white/80 leading-6">{kcContext.message.summary}</p>
            )}

            {kcContext.status && (
                <p className="text-xs text-white/50 font-mono mt-4">{kcContext.status}</p>
            )}

            <a
                href="/"
                className="inline-block text-center text-sm text-white/70 underline underline-offset-4 hover:text-white mt-6"
            >
                Return to sign in
            </a>
        </Template>
    );
}
