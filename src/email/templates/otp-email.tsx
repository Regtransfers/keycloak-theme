import { GetSubject, GetTemplate, GetTemplateProps } from "keycloakify-emails";
import { render } from "jsx-email";
import { EmailWrapper } from "../EmailWrapper";
import { cs } from "../layout";
import { buildEmailHtml } from "../wrapper";

interface TemplateProps extends Omit<GetTemplateProps, "plainText"> {}

export const previewProps: TemplateProps = {
    locale: "en",
    themeName: "keycloak-theme",
};

export const templateName = "One-Time Access Code";

const Content = (_props: TemplateProps) => (
    <tr>
        <td style={cs.outerTd}>
            <p style={cs.p}>Someone requested a one-time-password to login to ${"${realmName}"}.</p>
            <p style={cs.p}>
                <strong>Code: ${"${code}"}</strong>
            </p>
            <p style={cs.muted}>If you did not request this code, please ignore this email.</p>
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
    return "Your access code for ${realmName}";
};
