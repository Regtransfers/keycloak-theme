import { GetSubject, GetTemplate, GetTemplateProps } from "keycloakify-emails";
import { createVariablesHelper } from "keycloakify-emails/variables";
import { EmailWrapper } from "../EmailWrapper";
import { cs, SignOff } from "../layout";
import { buildEmailHtml, buildEmailPlainText } from "../wrapper";

interface TemplateProps extends Omit<GetTemplateProps, "plainText"> {}

export const previewProps: TemplateProps = {
    locale: "en",
    themeName: "keycloak-theme",
};

export const templateName = "Email Test";

const { exp } = createVariablesHelper("email-test.ftl");

const Content = (_props: TemplateProps) => (
    <tr>
        <td style={cs.outerTd}>
            <h1 style={cs.h1}>SMTP test</h1>
            <p style={cs.p}>
                This is a test message from {exp("realmName")}. Your email configuration is working correctly.
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
    if (props.plainText) {
        return await buildEmailPlainText(
            <>
                <Content {...props} />
                <SignOff />
            </>
        );
    }
    return buildEmailHtml(<Template {...props} />);
};

export const getSubject: GetSubject = async () => {
    return "[KEYCLOAK] - SMTP test message";
};
