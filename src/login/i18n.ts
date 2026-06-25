/* eslint-disable @typescript-eslint/no-unused-vars */
import { i18nBuilder } from "keycloakify/login";
import type { ThemeName } from "../kc.gen";

/** @see: https://docs.keycloakify.dev/features/i18n */
const { useI18n, ofTypeI18n } = i18nBuilder
    .withThemeName<ThemeName>()
    .withCustomTranslations({
        en: {
            welcomeMessage: "Sign in to your Regtransfers account to manage your personalised number plates.",
            "passkey-signin-with-passkey-label": "Sign in with a passkey",
            or: "or",
            doLogIn: "Sign in",
            doResend: "Resend",
            doRegister: "Create one",
            doForgotPassword: "Forgot password?",
            noAccount: "No account?",
            registerTitle: "Join Regtransfers",
            rememberMe: "Remember me",
            loginAccountTitle: "Sign in",
            passwordConfirm: "Confirm password",
            magicLinkContinuationConfirmation: "Waiting for confirmation. This page refreshes automatically.",
            magicLinkSuccessfulLogin: "You have successfully signed in using your email link.",
            magicLinkHasBeenUsed: "This sign-in link has already been used or has expired.",
            loginPage: "Continue",
            mobileNumber: "Mobile number",
            marketingConsent: "Please send me special offers, discounts and number plates that may be relevant to me. I understand I can unsubscribe at any time.",
        }
    })
    .build();

type I18n = typeof ofTypeI18n;

export { useI18n, type I18n };
