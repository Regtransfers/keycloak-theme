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

export const templateName = "Email Update Confirmation";

const { exp } = createVariablesHelper("email-update-confirmation.ftl");

const Content = (_props: TemplateProps) => (
    <tr>
        <td style={cs.outerTd}>
            <h1 style={cs.h1}>Confirm your new email address</h1>
            <p style={cs.p}>
                You requested to update your {exp("realmName")} account email address to{" "}
                <strong style={cs.strong}>{exp("newEmail")}</strong>. Click the button below to
                confirm this change.
            </p>
            <EmailButton href={exp("link")}>Confirm new email</EmailButton>
            <p style={cs.muted}>
                This link will expire within {exp("linkExpirationFormatter(linkExpiration)")}. If you
                didn&apos;t request this change, just ignore this message.
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
    return "Verify your new email address";
};
