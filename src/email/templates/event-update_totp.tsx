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

export const templateName = "TOTP Updated";

const { exp } = createVariablesHelper("event-update_totp.ftl");

const Content = (_props: TemplateProps) => (
    <tr>
        <td style={cs.outerTd}>
            <h1 style={cs.h1}>Authenticator app updated</h1>
            <p style={cs.p}>
                The authenticator app (TOTP) on your {exp("realmName")} account was updated.
            </p>
            <EventAlert date={exp("event.date")} ipAddress={exp("event.ipAddress")} />
            <p style={cs.muted}>
                If you made this change, no action is needed. If you don&apos;t recognise this
                activity, please contact support immediately and secure your account.
            </p>
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
    return "Authenticator app updated on your account";
};
