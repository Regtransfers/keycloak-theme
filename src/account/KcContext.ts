/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { ExtendKcContext } from "keycloakify/account";
import type { KcEnvName, ThemeName } from "../kc.gen";

export type KcContextExtension = {
    themeName: ThemeName;
    properties: Record<KcEnvName, string> & {};
};

export type KcContextExtensionPerPage = {
    "update-user-profile.ftl": {};
    "federated-identity-confirm-link.ftl": {};
};

export type KcContext = ExtendKcContext<KcContextExtension, KcContextExtensionPerPage>;
