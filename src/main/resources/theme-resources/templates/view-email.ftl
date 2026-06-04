<#import "template.ftl" as layout>
<@layout.registrationLayout displayRequiredFields=false displayMessage=false displayInfo=false; section>
  <#if section = "header">
    <style>
      body,
      body.login-pf {
        min-height: 100vh;
        background-image:
          linear-gradient(rgba(20, 43, 88, 0.74), rgba(20, 43, 88, 0.74)),
          url("https://images.regtransfers.co.uk/websiteimages/banners/pages/porsche-gt3rs-white-jmr1-td.webp");
        background-size: cover;
        background-position: 65% 50%;
      }

      #kc-header,
      #kc-header-wrapper,
      #kc-page-title,
      #kc-info,
      #kc-info-wrapper,
      #kc-form-options,
      #reset-login,
      .kc-login-tooltip {
        display: none !important;
      }

      #kc-content-wrapper,
      #kc-content,
      #kc-form {
        max-width: 420px !important;
        width: 100%;
        margin: 0 auto;
        padding: 0 !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      #kc-content {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .rt-header {
        width: 100%;
        text-align: left;
        margin-bottom: 0.9rem;
      }

      .rt-logo {
        display: block;
        margin: 0 auto 1.2rem;
        height: 46px;
        width: auto;
      }

      .rt-title {
        margin: 0;
        font-size: 2rem;
        line-height: 1.1;
        font-weight: 700;
        color: #ffffff;
      }

      .rt-subtitle {
        margin-top: 0.55rem;
        font-size: 0.96rem;
        line-height: 1.5;
        color: rgba(255, 255, 255, 0.82);
      }

      .rt-card {
        width: 100%;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(33, 51, 88, 0.78);
        border-radius: 16px;
        box-shadow: 0 24px 50px rgba(4, 10, 25, 0.45);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        color: #ffffff;
        padding: 1.25rem;
      }

      .rt-copy {
        margin: 0 0 1rem;
        font-size: 0.95rem;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.88);
      }

      .rt-username {
        display: block;
        margin-top: 0.3rem;
        font-weight: 600;
        color: #ffffff;
      }

      .rt-primary {
        width: 100%;
        min-height: 42px;
        border: 1px solid #1b9a38;
        border-radius: 8px;
        background: #0a9c46;
        color: #ffffff;
        font-size: 0.95rem;
        cursor: pointer;
      }

      .rt-primary:hover {
        background: #00793b;
      }

      .rt-link {
        display: inline-block;
        margin-top: 0.9rem;
        color: #f5c100;
        text-decoration: underline;
        text-underline-offset: 3px;
      }
    </style>

    <img class="rt-logo" src="https://images.regtransfers.co.uk/websiteimages/branding/logo-regtransfers@2x.png" alt="Regtransfers" />
    <div class="rt-header">
      <h1 class="rt-title">Check your email</h1>
      <div class="rt-subtitle">We sent a secure sign-in link to ${auth.attemptedUsername!"your inbox"}</div>
    </div>
  <#elseif section = "form">
    <div class="rt-card">
      <p class="rt-copy">
        ${msg("magicLinkConfirmation")}
        <span class="rt-username">${auth.attemptedUsername!"your inbox"}</span>
      </p>

      <form action="${url.loginAction}" method="post">
        <button type="submit" id="kc-resend" name="resend" class="rt-primary">${msg("doResend")}</button>
      </form>

      <a href="${url.loginRestartFlowUrl}" id="try-another-way" class="rt-link">Try Another Way</a>
    </div>
  </#if>
</@layout.registrationLayout>