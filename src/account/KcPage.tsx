import { Suspense, useEffect } from "react";
import type { KcContext } from "./KcContext";
import { useI18n } from "./i18n";
import DefaultPage from "keycloakify/account/DefaultPage";
import { Template } from "./components/Template";
import UpdateAccountInformation from "./pages/UpdateAccountInformation";
import FederatedIdentityConfirmLink from "./pages/FederatedIdentityConfirmLink";
import "../login/main.css";

export default function KcPage(props: { kcContext: KcContext }) {
    const { kcContext } = props;

    const { i18n } = useI18n({ kcContext });

    useEffect(() => {
        if (kcContext.themeName.endsWith("-dark")) {
            document.body.classList.add("theme-dark", "dark");
        } else {
            document.body.classList.remove("theme-dark", "dark");
        }
    }, [kcContext.themeName]);

    return (
        <Suspense>
            {(() => {
                switch (kcContext.pageId as string) {
                    case "update-user-profile.ftl":
                        return (
                            <UpdateAccountInformation
                                kcContext={kcContext as Extract<KcContext, { pageId: "update-user-profile.ftl" }>}
                                i18n={i18n}
                            />
                        );
                    case "federated-identity-confirm-link.ftl":
                        return (
                            <FederatedIdentityConfirmLink
                                kcContext={kcContext as Extract<KcContext, { pageId: "federated-identity-confirm-link.ftl" }>}
                                i18n={i18n}
                            />
                        );
                    default:
                        return (
                            <DefaultPage
                                kcContext={kcContext as never}
                                i18n={i18n}
                                Template={Template}
                                doUseDefaultCss={true}
                            />
                        );
                }
            })()}
        </Suspense>
    );
}
