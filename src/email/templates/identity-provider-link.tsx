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

export const templateName = "Identity Provider Link";

const { exp } = createVariablesHelper("identity-provider-link.ftl");

const Content = (_props: TemplateProps) => (
    <tr>
        <td style={cs.outerTd}>
            <h1 style={cs.h1}>Link your {exp("identityProviderDisplayName")} account</h1>
            <p style={cs.p}>
                A request was made to link your {exp("realmName")} account with your{" "}
                {exp("identityProviderDisplayName")} account{" "}
                <strong style={cs.strong}>{exp("identityProviderContext.username")}</strong>.
                Click the button below to confirm.
            </p>
            <EmailButton href={exp("link")}>Link account</EmailButton>
            <p style={cs.muted}>
                This link will expire within {exp("linkExpirationFormatter(linkExpiration)")}. If you
                didn&apos;t make this request, just ignore this message.
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
    return "Link your identity provider account";
};
