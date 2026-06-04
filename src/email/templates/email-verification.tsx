import { GetSubject, GetTemplate, GetTemplateProps } from "keycloakify-emails";
import { createVariablesHelper } from "keycloakify-emails/variables";
import { render } from "jsx-email";
import { EmailWrapper } from "../EmailWrapper";
import { cs, EmailButton } from "../layout";
import { buildEmailHtml } from "../wrapper";

interface TemplateProps extends Omit<GetTemplateProps, "plainText"> {}

export const previewProps: TemplateProps = {
    locale: "en",
    themeName: "keycloak-theme",
};

export const templateName = "Email Verification";

const { exp } = createVariablesHelper("email-verification.ftl");

const Content = (_props: TemplateProps) => (
    <tr>
        <td style={cs.outerTd}>
            <h1 style={cs.h1}>Verify your email address</h1>
            <p style={cs.p}>
                Someone has created a {exp("realmName")} account with this email address.
                If this was you, click the button below to verify your email address.
            </p>
            <EmailButton href={exp("link")}>Verify email address</EmailButton>
            <p style={cs.muted}>
                This link will expire within {exp("linkExpirationFormatter(linkExpiration)")}. If you
                didn&apos;t create this account, just ignore this message.
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
    return "Verify your email address";
};
