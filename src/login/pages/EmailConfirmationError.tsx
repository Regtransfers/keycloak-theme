import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Template } from "../components/Template";

type EmailConfirmationErrorKcContext = Extract<KcContext, { pageId: "email-confirmation-error.ftl" }>;

type Props = {
    kcContext: EmailConfirmationErrorKcContext;
    i18n: I18n;
};

export default function EmailConfirmationError({ kcContext, i18n }: Props) {
    const { msg } = i18n;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={<p className="kc-display-heading font-bold font-[Roboto]">Link expired</p>}
            displayMessage
            displayInfo={false}
        >
            <p className="text-sm text-white/80 leading-6">{msg("magicLinkHasBeenUsed")}</p>
        </Template>
    );
}
