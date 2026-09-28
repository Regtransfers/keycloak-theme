import { GetSubject, GetTemplate, GetTemplateProps } from "keycloakify-emails";
import { EmailWrapper } from "../EmailWrapper";
import { cs, EmailButton, SignOff } from "../layout";
import { buildEmailHtml, buildEmailPlainText } from "../wrapper";

interface TemplateProps extends Omit<GetTemplateProps, "plainText"> {}

export const previewProps: TemplateProps = {
    locale: "en",
    themeName: "keycloak-theme",
};

export const templateName = "Magic Link";

// Sent by the Phase Two magic-link extension, which exposes the sign-in URL as
// "magicLink". It isn't a standard Keycloak variable, so createVariablesHelper
// doesn't know about it — write the FreeMarker expression directly.
const MAGIC_LINK_EXPRESSION = "${magicLink}";

const Content = (_props: TemplateProps) => (
    <tr>
        <td style={cs.outerTd}>
            <p style={cs.p}>Hi there,</p>
            <h1 className="h1" style={cs.headline}>Your sign in request</h1>
            <p style={cs.p}>
                We received a request to sign in to your Regtransfers account. Click the button
                below to sign in.
            </p>
            <table cellSpacing={0} cellPadding={0} border={0} style={{ margin: "0 auto" }}>
                <tbody>
                    <tr>
                        <td align="center">
                            <EmailButton href={MAGIC_LINK_EXPRESSION}>Sign in to Regtransfers</EmailButton>
                        </td>
                    </tr>
                </tbody>
            </table>
            <p style={{ ...cs.p, marginTop: "16px" }}>This link can only be used once. It expires in 15 minutes.</p>
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
    return "Sign in to your Regtransfers account";
};
