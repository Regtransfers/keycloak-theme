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

export const templateName = "Login Error";

const { exp } = createVariablesHelper("event-login_error.ftl");

const Content = (_props: TemplateProps) => (
    <tr>
        <td style={cs.outerTd}>
            <h1 style={cs.h1}>Failed login attempt</h1>
            <p style={cs.p}>
                A failed login attempt was detected on your {exp("realmName")} account.
            </p>
            <EventAlert date={exp("event.date")} ipAddress={exp("event.ipAddress")} />
            <p style={cs.muted}>
                If this was you, no action is needed. If you don&apos;t recognise this activity,
                please reset your password immediately and contact support.
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
    return "Failed login attempt on your account";
};
