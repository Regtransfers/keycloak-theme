import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Template } from "../components/Template";

type LoginPageExpiredKcContext = Extract<KcContext, { pageId: "login-page-expired.ftl" }>;

type Props = {
    kcContext: LoginPageExpiredKcContext;
    i18n: I18n;
};

export default function LoginPageExpired({ kcContext, i18n }: Props) {
    const { url } = kcContext;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={<p className="kc-display-heading font-bold font-[Roboto]">Page expired</p>}
            displayMessage={false}
            displayInfo={false}
        >
            <div className="flex flex-col gap-4">
                <p className="text-sm text-white/80 leading-6">
                    Your sign-in page has expired. Please return to sign in and try again.
                </p>

                <div className="border-t border-white/20 pt-4 text-center">
                    <a
                        href={url.loginRestartFlowUrl}
                        className="text-sm text-white/70 underline underline-offset-4 hover:text-white"
                    >
                        Return to sign in
                    </a>
                </div>
            </div>
        </Template>
    );
}
