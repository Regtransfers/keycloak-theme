import type { DeepPartial } from "keycloakify/tools/DeepPartial";
import type { KcContext } from "./KcContext";
import KcPage from "./KcPage";
import { createGetKcContextMock } from "keycloakify/login/KcContext";
import type { KcContextExtension, KcContextExtensionPerPage } from "./KcContext";
import { themeNames, kcEnvDefaults } from "../kc.gen";

const kcContextExtension: KcContextExtension = {
    themeName: themeNames[0],
    properties: {
        ...kcEnvDefaults
    }
};
const kcContextExtensionPerPage: KcContextExtensionPerPage = {
    "otp-form.ftl": {
        auth: {
            attemptedUsername: "user@example.com"
        },
        url: {
            loginRestartFlowUrl: "#",
            loginAction: "#"
        }
    },
    "login-verify-email.ftl": {
        auth: {
            attemptedUsername: "user@example.com"
        },
        url: {
            loginAction: "#",
            loginRestartFlowUrl: "#"
        }
    },
    "email-confirmation.ftl": {
        magicLinkContinuation: {
            sameBrowser: true,
            url: "#"
        }
    },
    "email-confirmation-error.ftl": {},
    "error.ftl": {
        message: {
            summary: "Invalid parameter: redirect_uri"
        },
        status: "Invalid parameter"
    },
    "view-email.ftl": {
        auth: {
            attemptedUsername: "user@example.com"
        }
    },
    "view-email-continuation.ftl": {
        auth: {
            attemptedUsername: "user@example.com"
        },
        pollingUrl: ""
    }
};

export const { getKcContextMock } = createGetKcContextMock({
    kcContextExtension,
    kcContextExtensionPerPage,
    overrides: {},
    overridesPerPage: {}
});

export function createKcPageStory<PageId extends KcContext["pageId"]>(params: {
    pageId: PageId;
}) {
    const { pageId } = params;

    function KcPageStory(props: {
        kcContext?: DeepPartial<Extract<KcContext, { pageId: PageId }>>;
    }) {
        const { kcContext: overrides } = props;

        const kcContextMock = getKcContextMock({
            pageId,
            overrides
        });

        return <KcPage kcContext={kcContextMock} />;
    }

    return { KcPageStory };
}
