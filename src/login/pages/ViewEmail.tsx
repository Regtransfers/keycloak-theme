import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Template } from "../components/Template";
import { useSignInAwareness } from "../lib/signInAwareness";

type ViewEmailKcContext = {
    pageId: "view-email.ftl";
    url: {
        loginAction: string;
        loginRestartFlowUrl: string;
        ssoLoginInOtherTabsUrl?: string;
    };
    auth?: {
        attemptedUsername?: string;
    };
};

type Props = {
    kcContext: ViewEmailKcContext;
    i18n: I18n;
};

export default function ViewEmail({ kcContext, i18n }: Props) {
    const { auth, url } = kcContext;

    // The customer leaves this page open while they go to their inbox. When the link signs them in (in
    // another tab of this browser) carry this tab on to where they were going; if the attempt has
    // expired by the time they come back, start again rather than leave them on a dead page.
    useSignInAwareness({ signedInUrl: url.ssoLoginInOtherTabsUrl });

    const attemptedUsername = auth?.attemptedUsername ?? "your inbox";

    return (
        <Template
            kcContext={kcContext as never}
            i18n={i18n}
            headerNode={
                <>
                    <p className="kc-display-heading font-bold font-[Roboto]">Check your email</p>
                    <h1 className="text-[0.9375rem] font-normal text-white/80 mt-1 font-[Arimo]">
                        We sent a secure sign-in link to {attemptedUsername}
                    </h1>
                </>
            }
            displayMessage={false}
            displayInfo={false}
        >
            <div className="flex flex-col gap-4">
                <p className="text-sm text-white/80 leading-6">
                    Check your email, and click on the link to log in!
                </p>

                <form action={url.loginAction} method="post" className="flex flex-col gap-3 mt-3 mb-4">
                    <Button
                        type="submit"
                        id="kc-resend"
                        name="resend"
                        size="lg"
                        className="w-full border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d]"
                    >
                        Resend
                    </Button>
                </form>

                {/* self-center so the link (and its underline) is only as wide as its text */}
                <a href={url.loginRestartFlowUrl} className="self-center text-sm">
                    Go back
                </a>
            </div>
        </Template>
    );
}