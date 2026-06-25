import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { Button } from "@/components/ui/button";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Template } from "../components/Template";

type InfoKcContext = Extract<KcContext, { pageId: "info.ftl" }>;

type Props = {
    kcContext: InfoKcContext;
    i18n: I18n;
};

export default function Info({ kcContext, i18n }: Props) {
    const { advancedMsgStr, msg } = i18n;
    const { messageHeader, message, requiredActions, skipLink, pageRedirectUri, actionUri, client } = kcContext;
    const showVerifiedHomepageLink =
        skipLink &&
        ((messageHeader ?? "").toLowerCase().includes("email address verified") ||
            (message.summary ?? "").toLowerCase().includes("email address has been verified"));

    const summaryWithRequiredActions = (() => {
        let html = message.summary?.trim() ?? "";

        if (requiredActions && requiredActions.length > 0) {
            const translatedActions = requiredActions
                .map(requiredAction => advancedMsgStr(`requiredAction.${requiredAction}`))
                .join(", ");

            html += ` <b>${translatedActions}</b>`;
        }

        return html;
    })();

    const cta = (() => {
        if (skipLink) {
            return undefined;
        }

        if (pageRedirectUri) {
            return { href: pageRedirectUri, label: msg("backToApplication"), kind: "back" as const };
        }

        if (actionUri) {
            return { href: actionUri, label: "Proceed", kind: "proceed" as const };
        }

        if (client.baseUrl) {
            return { href: client.baseUrl, label: msg("backToApplication"), kind: "back" as const };
        }

        return undefined;
    })();

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={
                <p
                    className="kc-display-heading font-bold font-[Roboto]"
                    dangerouslySetInnerHTML={{
                        __html: kcSanitize(messageHeader ? advancedMsgStr(messageHeader) : message.summary)
                    }}
                />
            }
            displayMessage={false}
            displayInfo={false}
        >
            <div className="flex flex-col gap-4">
                <p
                    className="text-sm text-white/80 leading-6"
                    dangerouslySetInnerHTML={{
                        __html: kcSanitize(summaryWithRequiredActions)
                    }}
                />

                {cta &&
                    (cta.kind === "proceed" ? (
                        <Button
                            type="button"
                            size="lg"
                            className="w-full border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d]"
                            onClick={() => {
                                window.location.assign(cta.href);
                            }}
                        >
                            {cta.label}
                        </Button>
                    ) : (
                        <div className="text-left">
                            <a
                                href={cta.href}
                                className="text-sm text-[#f5c100] underline underline-offset-4 hover:text-[#ffd84a]"
                            >
                                {cta.label}
                            </a>
                        </div>
                    ))}

                {showVerifiedHomepageLink && (
                    <div className="border-t border-white/20 pt-4 text-center">
                        <a
                            href="https://www.regtransfers.co.uk"
                            className="text-sm text-white/70 underline underline-offset-4 hover:text-white"
                        >
                            Go to Regtransfers home
                        </a>
                    </div>
                )}
            </div>
        </Template>
    );
}