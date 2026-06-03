<#import "template.ftl" as layout>
<@layout.registrationLayout displayRequiredFields=false displayMessage=false; section>
  <#if section = "header">
    <div style="text-align: left; width: 100%; margin-bottom: 10px;">
      <div style="font-size: 1.05rem; font-weight: 700; color: #ffffff; font-family: Arimo, Helvetica, Arial, sans-serif;">
        Check your email
      </div>
      <div style="margin-top: 6px; font-size: 0.95rem; color: rgba(255,255,255,0.82); font-family: Arimo, Helvetica, Arial, sans-serif;">
        We sent a secure sign-in link to ${auth.attemptedUsername!"your inbox"}
      </div>
    </div>
  <#elseif section = "form">
    <p style="margin: 0 0 16px 0; color: rgba(255,255,255,0.88); line-height: 1.6; font-family: Arimo, Helvetica, Arial, sans-serif;">
      ${msg("magicLinkConfirmation")}
    </p>

    <form action="${url.loginAction}" method="post" style="margin: 0 0 12px 0;">
      <button
        type="submit"
        id="kc-resend"
        name="resend"
        style="width: 100%; display: inline-block; border: 1px solid #1b9a38; background: transparent; color: #ffffff; border-radius: 8px; padding: 12px 16px; font-size: 0.98rem; cursor: pointer;"
      >
        ${msg("doResend")}
      </button>
    </form>

    <a
      href="${url.loginRestartFlowUrl}"
      id="try-another-way"
      style="display: inline-block; color: rgba(255,255,255,0.78); text-decoration: underline; text-underline-offset: 3px; font-family: Arimo, Helvetica, Arial, sans-serif; font-size: 0.92rem;"
    >
      Try Another Way
    </a>
  </#if>
</@layout.registrationLayout>