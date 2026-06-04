import { Suspense, lazy, useEffect } from "react";
import type { ClassKey } from "keycloakify/login";
import type { KcContext } from "./KcContext";
import { useI18n } from "./i18n";
import DefaultPage from "keycloakify/login/DefaultPage";
import Template from "keycloakify/login/Template";
import Login from "./pages/Login";
import LoginUsername from "./pages/LoginUsername";
import ViewEmail from "./pages/ViewEmail";
import ViewEmailContinuation from "./pages/ViewEmailContinuation";
import OtpForm from "./pages/OtpForm";
import EmailConfirmation from "./pages/EmailConfirmation";
import EmailConfirmationError from "./pages/EmailConfirmationError";
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
                switch (kcContext.pageId as string) {
                    case "login.ftl":
                        return <Login kcContext={kcContext as Extract<KcContext, { pageId: "login.ftl" }>} i18n={i18n} />;
                    case "register.ftl":
                        return <Register kcContext={kcContext as Extract<KcContext, { pageId: "register.ftl" }>} i18n={i18n} />;
                    case "login-reset-password.ftl":
                        return <LoginResetCredentials kcContext={kcContext as Extract<KcContext, { pageId: "login-reset-password.ftl" }>} i18n={i18n} />;
                    case "login-update-password.ftl":
                        return <LoginUpdatePassword kcContext={kcContext as Extract<KcContext, { pageId: "login-update-password.ftl" }>} i18n={i18n} />;
                    case "login-otp.ftl":
                        return <LoginOtp kcContext={kcContext as Extract<KcContext, { pageId: "login-otp.ftl" }>} i18n={i18n} />;
                    case "login-config-totp.ftl":
                        return <LoginConfigTotp kcContext={kcContext as Extract<KcContext, { pageId: "login-config-totp.ftl" }>} i18n={i18n} />;
                    case "login-username.ftl":
                        return <LoginUsername kcContext={kcContext as Extract<typeof kcContext, { pageId: "login-username.ftl" }>} i18n={i18n} />;
                    case "view-email.ftl":
                        return <ViewEmail kcContext={kcContext as never} i18n={i18n} />;
                    case "view-email-continuation.ftl":
                        return (
                            <ViewEmailContinuation
                                kcContext={kcContext as Extract<KcContext, { pageId: "view-email-continuation.ftl" }>}
                                i18n={i18n}
                            />
                        );
                    case "otp-form.ftl":
                        return <OtpForm kcContext={kcContext as Extract<KcContext, { pageId: "otp-form.ftl" }>} i18n={i18n} />;
                    case "email-confirmation.ftl":
                        return (
                            <EmailConfirmation
                                kcContext={kcContext as Extract<KcContext, { pageId: "email-confirmation.ftl" }>}
                                i18n={i18n}
                            />
                        );
                    case "email-confirmation-error.ftl":
                        return (
                            <EmailConfirmationError
                                kcContext={kcContext as Extract<KcContext, { pageId: "email-confirmation-error.ftl" }>}
                                i18n={i18n}
                            />
                        );
                    default:
                        return (
                            <DefaultPage
                                kcContext={kcContext as never}
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
