import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Template } from "../components/Template";

type FederatedIdentityConfirmLinkKcContext = Extract<KcContext, { pageId: "federated-identity-confirm-link.ftl" }>;

type Props = {
    kcContext: FederatedIdentityConfirmLinkKcContext;
    i18n: I18n;
};

export default function FederatedIdentityConfirmLink({ kcContext, i18n }: Props) {
    const { url } = kcContext;
    const { msgStr } = i18n;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={<p className="kc-display-heading font-bold font-[Roboto]">Account already exists</p>}
            displayMessage={true}
        >
            <form id="kc-confirm-link-form" action={url.accountUrl} method="post" className="flex flex-col gap-4">
                {/* Hidden field for federated identity link confirmation */}
                <input type="hidden" id="identityProviderId" name="identityProviderId" value="" />

                {/* Action buttons */}
                <div className="flex flex-col gap-2 pt-2">
                    {/* Review profile button */}
                    <Button
                        type="submit"
                        id="kc-review-profile-button"
                        name="submitAction"
                        value="Review profile"
                        size="lg"
                        className="w-full border border-white/30 bg-white/10 hover:bg-white/20 text-white"
                    >
                        {msgStr("doReviewProfile")}
                    </Button>

                    {/* Add to existing account button */}
                    <Button
                        type="submit"
                        id="kc-add-to-existing-account-button"
                        name="submitAction"
                        value="Add to existing account"
                        size="lg"
                        className="w-full border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d]"
                    >
                        {msgStr("doAddToExistingAccount")}
                    </Button>
                </div>
            </form>
        </Template>
    );
}
