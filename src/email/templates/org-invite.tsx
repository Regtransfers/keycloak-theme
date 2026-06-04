import { GetSubject, GetTemplate, GetTemplateProps } from "keycloakify-emails";
import { createVariablesHelper } from "keycloakify-emails/variables";
import { render } from "jsx-email";
import * as Fm from "keycloakify-emails/jsx-email";
import { EmailWrapper } from "../EmailWrapper";
import { cs, EmailButton } from "../layout";
import { buildEmailHtml } from "../wrapper";

interface TemplateProps extends Omit<GetTemplateProps, "plainText"> {}

export const previewProps: TemplateProps = {
    locale: "en",
    themeName: "keycloak-theme",
};

export const templateName = "Organisation Invite";

const { exp, v } = createVariablesHelper("org-invite.ftl");

const Content = (_props: TemplateProps) => (
    <tr>
        <td style={cs.outerTd}>
            <Fm.If condition={`${v("firstName")}?? && ${v("lastName")}??`}>
                <h1 style={cs.h1}>Hi, {exp("firstName")} {exp("lastName")}.</h1>
            </Fm.If>
            <Fm.If condition={`!(${v("firstName")}?? && ${v("lastName")}??)`}>
                <h1 style={cs.h1}>You&apos;re invited!</h1>
            </Fm.If>
            <p style={cs.p}>
                You have been invited to join the{" "}
                <strong style={cs.strong}>{exp("organization.name")}</strong> organisation on{" "}
                {exp("realmName")}. Click the button below to accept the invitation.
            </p>
            <EmailButton href={exp("link")}>Accept invitation</EmailButton>
            <p style={cs.muted}>
                This link will expire within {exp("linkExpirationFormatter(linkExpiration)")}. If you
                don&apos;t want to join this organisation, just ignore this message.
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
    return "You've been invited to join an organisation";
};
