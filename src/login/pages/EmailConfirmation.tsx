import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Template } from "../components/Template";

type EmailConfirmationKcContext = Extract<KcContext, { pageId: "email-confirmation.ftl" }>;

type Props = {
    kcContext: EmailConfirmationKcContext;
    i18n: I18n;
};

export default function EmailConfirmation({ kcContext, i18n }: Props) {
    const { msg } = i18n;
    const { magicLinkContinuation } = kcContext;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={<p className="kc-display-heading font-bold font-[Roboto]">Signed in</p>}
            displayMessage={false}
            displayInfo={false}
        >
            {magicLinkContinuation.sameBrowser ? (
                <div className="flex flex-col gap-3 text-sm text-white/80 leading-6">
                    <p>{msg("magicLinkSuccessfulLogin")}</p>
                    <a
                        href={magicLinkContinuation.url}
                        className="text-white underline underline-offset-4 hover:text-white/90"
                    >
                        {msg("loginPage")}
                    </a>
                </div>
            ) : (
                <p className="text-sm text-white/80 leading-6">{msg("magicLinkSuccessfulLogin")}</p>
            )}
        </Template>
    );
}
