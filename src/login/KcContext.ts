/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { ExtendKcContext } from "keycloakify/login";
import type { KcEnvName, ThemeName } from "../kc.gen";

export type KcContextExtension = {
    themeName: ThemeName;
    properties: Record<KcEnvName, string> & {};
    // NOTE: Here you can declare more properties to extend the KcContext
    // See: https://docs.keycloakify.dev/faq-and-help/some-values-you-need-are-missing-from-in-kccontext
};

export type KcContextExtensionPerPage = {
    "otp-form.ftl": {
        auth: {
            attemptedUsername: string;
        };
        url: {
            loginRestartFlowUrl: string;
            loginAction: string;
        };
    };
    "login-verify-email.ftl": {
        auth?: {
            attemptedUsername?: string;
        };
        url: {
            loginAction: string;
            loginRestartFlowUrl?: string;
        };
        storybook?: {
            forceVerifiedState?: boolean;
        };
    };
    "email-confirmation.ftl": {
        magicLinkContinuation: {
            sameBrowser: boolean;
            url: string;
        };
    };
    "email-confirmation-error.ftl": {};
    "error.ftl": {
        message?: {
            summary?: string;
        };
        status?: string;
    };
    "login-page-expired.ftl": {
        url: {
            loginRestartFlowUrl: string;
        };
    };
       "login-idp-link-email.ftl": {
           idpAlias?: string;
           username?: string;
           url: {
               loginAction: string;
               loginRestartFlowUrl?: string;
           };
       };
    "view-email.ftl": {
        auth: {
            attemptedUsername: string;
        };
    };
    "view-email-continuation.ftl": {
        auth: {
            attemptedUsername: string;
        };
        pollingUrl?: string;
    };
};

export type KcContext = ExtendKcContext<KcContextExtension, KcContextExtensionPerPage>;
