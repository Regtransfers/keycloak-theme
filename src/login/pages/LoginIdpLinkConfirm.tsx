import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Template } from "../components/Template";

type LoginIdpLinkConfirmKcContext = Extract<KcContext, { pageId: "login-idp-link-confirm.ftl" | "login-idp-link-confirm-override.ftl" }>;

type Props = {
    kcContext: LoginIdpLinkConfirmKcContext;
    i18n: I18n;
};

export default function LoginIdpLinkConfirm({ kcContext, i18n }: Props) {
    const { url } = kcContext;
    const idpAlias = "idpAlias" in kcContext ? kcContext.idpAlias : "";
    const { msg } = i18n;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={
                <>
                    <p className="kc-display-heading font-bold font-[Roboto]">Confirm your sign-in</p>
                    <h1 className="text-[0.9375rem] font-normal text-white/80 mt-1 font-[Arimo]">
                        We found an existing account. Choose how to continue.
                    </h1>
                </>
            }
            displayInfo={false}
        >
            <form id="kc-register-form" action={url.loginAction} method="post" className="flex flex-col gap-3">
                <Button
                    type="submit"
                    name="submitAction"
                    id="updateProfile"
                    value="updateProfile"
                    size="lg"
                    variant="outline"
                    className="w-full"
                >
                    {msg("confirmLinkIdpReviewProfile")}
                </Button>
                <Button
                    type="submit"
                    name="submitAction"
                    id="linkAccount"
                    value="linkAccount"
                    size="lg"
                    className="w-full border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d]"
                >
                    {msg("confirmLinkIdpContinue", idpAlias)}
                </Button>
            </form>
        </Template>
    );
}
