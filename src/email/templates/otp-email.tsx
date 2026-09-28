import { GetSubject, GetTemplate, GetTemplateProps } from "keycloakify-emails";
import { EmailWrapper } from "../EmailWrapper";
import { cs, SignOff } from "../layout";
import { buildEmailHtml, buildEmailPlainText } from "../wrapper";

interface TemplateProps extends Omit<GetTemplateProps, "plainText"> {}

export const previewProps: TemplateProps = {
    locale: "en",
    themeName: "keycloak-theme",
};

export const templateName = "One-Time Password";

const OTP_CODE_EXPRESSION = "${code}";

const Content = (_props: TemplateProps) => (
    <tr>
        <td style={cs.outerTd}>
            <p style={cs.p}>Hi there,</p>
            <p style={cs.p}>
                We received a request for a one-time sign-in code for your account.
            </p>
            <p style={{ ...cs.p, textAlign: "center" }}>
                <strong>Your code:</strong>
            </p>
            <p style={{ ...cs.p, textAlign: "center", fontSize: "28px", fontWeight: "bold", letterSpacing: "4px" }}>
                {OTP_CODE_EXPRESSION}
            </p>
            <p style={cs.p}>
                This code can only be used once. It expires in 15 minutes
            </p>
            <p style={cs.p}>If this wasn&apos;t you, you can safely ignore this email.</p>
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
    return "Your one-time code for your account";
};
