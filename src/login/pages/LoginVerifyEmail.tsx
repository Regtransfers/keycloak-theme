import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Template } from "../components/Template";

type LoginVerifyEmailKcContext = {
    pageId: "login-verify-email.ftl";
    url: {
        loginAction: string;
        loginRestartFlowUrl?: string;
    };
    auth?: {
        attemptedUsername?: string;
    };
};

type Props = {
    kcContext: LoginVerifyEmailKcContext;
    i18n: I18n;
};

export default function LoginVerifyEmail({ kcContext, i18n }: Props) {
    const { url } = kcContext;

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
                    An email with instructions has been sent to your inbox. Unable to find the email? Check your spam/junk folder. If you still can't find it, click the button below.
                </p>


                <div className="flex flex-col gap-3">
               
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

                {url.loginRestartFlowUrl ? (
                    <div className="border-t border-white/20 pt-4 text-center">
                        <a
                            href={url.loginRestartFlowUrl}
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
