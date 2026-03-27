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
            doLogIn: "Sign in"
        }
    })
    .build();

type I18n = typeof ofTypeI18n;

export { useI18n, type I18n };
