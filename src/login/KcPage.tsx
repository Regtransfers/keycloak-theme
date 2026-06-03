import { Suspense, lazy, useEffect } from "react";
import type { ClassKey } from "keycloakify/login";
import type { KcContext } from "./KcContext";
import { useI18n } from "./i18n";
import DefaultPage from "keycloakify/login/DefaultPage";
import Template from "keycloakify/login/Template";
import Login from "./pages/Login";
import LoginUsername from "./pages/LoginUsername";
import Register from "./pages/Register";
import LoginResetCredentials from "./pages/LoginResetCredentials";
import LoginOtp from "./pages/LoginOtp";
import LoginConfigTotp from "./pages/LoginConfigTotp";
import LoginUpdatePassword from "./pages/LoginUpdatePassword";
import "./main.css";
const UserProfileFormFields = lazy(
    () => import("keycloakify/login/UserProfileFormFields")
);

const doMakeUserConfirmPassword = true;

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
                switch (kcContext.pageId) {
                    case "login.ftl":
                        return <Login kcContext={kcContext} i18n={i18n} />;
                    case "register.ftl":
                        return <Register kcContext={kcContext} i18n={i18n} />;
                    case "login-reset-password.ftl":
                        return <LoginResetCredentials kcContext={kcContext} i18n={i18n} />;
                    case "login-update-password.ftl":
                        return <LoginUpdatePassword kcContext={kcContext} i18n={i18n} />;
                    case "login-otp.ftl":
                        return <LoginOtp kcContext={kcContext} i18n={i18n} />;
                    case "login-config-totp.ftl":
                    case "login-username.ftl":
                        return <LoginUsername kcContext={kcContext} i18n={i18n} />;
                        return <LoginConfigTotp kcContext={kcContext} i18n={i18n} />;
                    default:
                        return (
                            <DefaultPage
                                kcContext={kcContext}
                                i18n={i18n}
                                classes={classes}
                                Template={Template}
                                doUseDefaultCss={true}
                                UserProfileFormFields={UserProfileFormFields}
                                doMakeUserConfirmPassword={doMakeUserConfirmPassword}
                            />
                        );
                }
            })()}
        </Suspense>
    );
}

const classes = {} satisfies { [key in ClassKey]?: string };
