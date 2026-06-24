/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { ExtendKcContext } from "keycloakify/account";
import type { KcEnvName, ThemeName } from "../kc.gen";

export type KcContextExtension = {
    themeName: ThemeName;
    properties: Record<KcEnvName, string> & {};
};

type ProfileAttribute = {
    name: string;
    value?: string;
    displayName: string;
    required: boolean;
    readOnly: boolean;
    validators: Record<string, unknown> & {
        length?: {
            max?: number;
        };
    };
    annotations: Record<string, unknown>;
    values?: string[];
    autocomplete?: string;
};

export type KcContextExtensionPerPage = {
    "update-user-profile.ftl": {
        profile: {
            attributesByName: Record<string, ProfileAttribute>;
        };
    };
    "federated-identity-confirm-link.ftl": {};
};

export type KcContext = ExtendKcContext<KcContextExtension, KcContextExtensionPerPage>;
