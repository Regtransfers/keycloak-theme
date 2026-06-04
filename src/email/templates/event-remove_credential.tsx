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

export const templateName = "Credential Removed";

const { exp } = createVariablesHelper("event-remove_credential.ftl");

const Content = (_props: TemplateProps) => (
    <tr>
        <td style={cs.outerTd}>
            <h1 style={cs.h1}>Credential removed</h1>
            <p style={cs.p}>
                A credential was removed from your {exp("realmName")} account.
            </p>
            <EventAlert date={exp("event.date")} ipAddress={exp("event.ipAddress")} />
            <p style={cs.muted}>
                If you made this change, no action is needed. If you don&apos;t recognise this
                activity, please contact support immediately.
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
    return "A credential was removed from your account";
};
