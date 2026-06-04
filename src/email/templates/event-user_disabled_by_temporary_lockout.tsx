import { GetSubject, GetTemplate, GetTemplateProps } from "keycloakify-emails";
import { createVariablesHelper } from "keycloakify-emails/variables";
import { render } from "jsx-email";
import { EmailWrapper } from "../EmailWrapper";
import { cs, EventAlert } from "../layout";
import { buildEmailHtml } from "../wrapper";

interface TemplateProps extends Omit<GetTemplateProps, "plainText"> {}

export const previewProps: TemplateProps = {
    locale: "en",
    themeName: "keycloak-theme",
};

export const templateName = "Account Temporarily Locked";

const { exp } = createVariablesHelper("event-user_disabled_by_temporary_lockout.ftl");

const Content = (_props: TemplateProps) => (
    <tr>
        <td style={cs.outerTd}>
            <h1 style={cs.h1}>Account temporarily locked</h1>
            <p style={cs.p}>
                Your {exp("realmName")} account has been temporarily locked due to too many failed
                login attempts. It will be automatically unlocked after a short period.
            </p>
            <EventAlert date={exp("event.date")} ipAddress={exp("event.ipAddress")} />
            <p style={cs.muted}>If you continue to have trouble, please contact support.</p>
        </td>
    </tr>
);

export const Template = (props: TemplateProps) => (
    <EmailWrapper>
        <Content {...props} />
    </EmailWrapper>
);

export const getTemplate: GetTemplate = async (props) => {
    if (props.plainText) return await render(<Content {...props} />, { plainText: true });
    return buildEmailHtml(<Template {...props} />);
};

export const getSubject: GetSubject = async () => {
    return "Your account has been temporarily locked";
};
