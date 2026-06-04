import { GetSubject, GetTemplate, GetTemplateProps } from "keycloakify-emails";
import { createVariablesHelper } from "keycloakify-emails/variables";
import { render } from "jsx-email";
import * as Fm from "keycloakify-emails/jsx-email";
import { ReactNode } from "react";
import { EmailWrapper } from "../EmailWrapper";
import { cs, EmailButton } from "../layout";
import { buildEmailHtml } from "../wrapper";

interface TemplateProps extends Omit<GetTemplateProps, "plainText"> {}

export const previewProps: TemplateProps = {
    locale: "en",
    themeName: "keycloak-theme",
};

export const templateName = "Execute Actions";

const { exp } = createVariablesHelper("executeActions.ftl");

const FmList = (props: { value: string; itemAs: string; children: ReactNode }) => (
    <>
        <Fm.Tag name="list" attributes={props.value}>
            <Fm.Tag name="items" attributes={`as ${props.itemAs}`}>
                {props.children}
            </Fm.Tag>
        </Fm.Tag>
    </>
);

const Content = (_props: TemplateProps) => (
    <tr>
        <td style={cs.outerTd}>
            <h1 style={cs.h1}>Action required</h1>
            <p style={cs.p}>
                Your administrator has requested that you update your {exp("realmName")} account by
                completing the following action(s):
            </p>
            <Fm.If condition="requiredActions??">
                <ul style={{ color: "#555555", fontSize: "15px", paddingLeft: "20px", margin: "0 0 20px", fontFamily: "Arial, Helvetica, sans-serif" }}>
                    <FmList value="requiredActions" itemAs="reqActionItem">
                        <li style={{ marginBottom: "6px" }}>
                            <Fm.If condition={`reqActionItem == 'UPDATE_PASSWORD'`}>Update Password</Fm.If>
                            <Fm.If condition={`reqActionItem == 'UPDATE_PROFILE'`}>Update Profile</Fm.If>
                            <Fm.If condition={`reqActionItem == 'VERIFY_EMAIL'`}>Verify Email</Fm.If>
                            <Fm.If condition={`reqActionItem == 'CONFIGURE_TOTP'`}>Configure Authenticator App</Fm.If>
                            <Fm.If condition={`reqActionItem == 'TERMS_AND_CONDITIONS'`}>Accept Terms and Conditions</Fm.If>
                            <Fm.If condition={`reqActionItem == 'CONFIGURE_RECOVERY_AUTHN_CODES'`}>Generate Recovery Codes</Fm.If>
                        </li>
                    </FmList>
                </ul>
            </Fm.If>
            <EmailButton href={exp("link")}>Complete required actions</EmailButton>
            <p style={cs.muted}>
                This link will expire within {exp("linkExpirationFormatter(linkExpiration)")}. If you
                were not expecting this request, please contact your administrator.
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
    return "Action required on your account";
};
