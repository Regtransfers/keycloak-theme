import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Template } from "../components/Template";

type LoginIdpLinkEmailKcContext = Extract<KcContext, { pageId: "login-idp-link-email.ftl" }>;

type Props = {
    kcContext: LoginIdpLinkEmailKcContext;
    i18n: I18n;
};

export default function LoginIdpLinkEmail({ kcContext, i18n }: Props) {
    const { url, idpAlias, username } = kcContext;

    // Get provider name from idpAlias or message
    const providerName = idpAlias ? idpAlias.charAt(0).toUpperCase() + idpAlias.slice(1) : "Identity Provider";

    return (
        <Template
            kcContext={kcContext as never}
            i18n={i18n}
            headerNode={<p className="kc-display-heading font-bold font-[Roboto]">Link {providerName}</p>}
            displayMessage={true}
            displayInfo={false}
        >
            <div className="flex flex-col gap-4">
                <p className="text-sm text-white/80 leading-6">
                    An email with instructions to link {providerName} account <strong>{username}</strong> with your Regtransfers account has been sent to you.
                </p>

                <p className="text-sm text-white/80 leading-6">
                    Haven't received a verification code in your email? Check your spam/junk folder. If you still can't find it, click the button below.
                </p>

                <div className="flex flex-col gap-3 mt-3 mb-0">
                    {/* Resend email form */}
                    <form action={url.loginAction} method="post">
                        <input type="hidden" name="isResend" value="true" />
                        <Button
                            type="submit"
                            id="kc-resend"
                            size="lg"
                            className="w-full border border-white/30 bg-white/10 hover:bg-white/20 text-white"
                        >
                            Re-send verification email
                        </Button>
                    </form>
                </div>

                {/* Try Another Way link */}
                <div className="border-t border-white/20 pt-4 text-center">
                    <a
                        href={url.loginRestartFlowUrl}
                        className="text-yellow-400 underline underline-offset-4 hover:text-yellow-300"
                    >
                        Try Another Way
                    </a>
                </div>
            </div>
        </Template>
    );
}
