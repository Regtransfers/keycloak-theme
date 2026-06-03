<#import "template.ftl" as layout>
<@layout.registrationLayout displayRequiredFields=false displayMessage=false displayInfo=false; section>
  <#if section = "header">
    <style>
      body, body.login-pf {
        background: linear-gradient(160deg, #12254d 0%, #0c1a36 100%) !important;
      }
      #kc-info,
      #kc-info-wrapper,
      #kc-form-options,
      #reset-login,
      .kc-login-tooltip {
        display: none !important;
      }
      #kc-content-wrapper,
      #kc-content {
        max-width: 620px;
      }
    </style>
    <div style="font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: 0.2px;">Check your email</div>
  <#elseif section = "form">
    <div style="background: rgba(16, 28, 56, 0.8); border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; padding: 22px; color: #ffffff;">
      <div style="font-size: 30px; margin-bottom: 12px; text-align: center;">📬</div>
      <div style="font-size: 20px; font-weight: 600; text-align: center; margin-bottom: 8px;">${auth.attemptedUsername!"your inbox"}</div>
      <p style="margin: 0 0 16px 0; color: rgba(255,255,255,0.86); text-align: center;">Check your email, and click on the link to log in.</p>

      <form action="${url.loginAction}" method="post" style="margin: 0 0 12px 0;">
        <button
          type="submit"
          id="kc-resend"
          name="resend"
          style="width: 100%; background: #0a9c46; border: none; color: #ffffff; padding: 11px 14px; border-radius: 6px; font-size: 15px; cursor: pointer;"
        >
          ${msg("doResend")}
        </button>
      </form>

      <a href="${url.loginRestartFlowUrl}" id="try-another-way" style="display: inline-block; color: #ffcf4a; text-decoration: underline; text-underline-offset: 3px;">Try Another Way</a>
    </div>
  </#if>
</@layout.registrationLayout>