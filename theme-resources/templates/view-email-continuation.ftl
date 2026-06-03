<#import "template.ftl" as layout>
<@layout.registrationLayout displayRequiredFields=false displayMessage=false displayInfo=false; section>
 <#if section = "header">
    <div id="kc-username" class="${properties.kcFormGroupClass!}">
      <label id="kc-attempted-username">${auth.attemptedUsername!"your inbox"}</label>
      <a id="reset-login" href="${url.loginRestartFlowUrl}" aria-label="${msg("restartLoginTooltip")}">
        <div class="kc-login-tooltip">
          <i class="${properties.kcResetFlowIcon!}"></i>
          <span class="kc-tooltip-text">${msg("restartLoginTooltip")}</span>
        </div>
      </a>
    </div>
  <#elseif section = "form">
    <div id="mlc-status">Waiting for confirmation...</div>
    <div id="mlc-exp"></div>
    <script>
      (function(){
        const pollingUrl = "${pollingUrl!""}";
        const loginActionUrl = "${url.loginAction?no_esc}";
        const statusEl = document.getElementById("mlc-status");
        const expEl = document.getElementById("mlc-exp");

        async function tick(){
          try {
            const r = await fetch(pollingUrl, { cache: "no-store", credentials: "same-origin" });
            if (!r.ok) {
              setTimeout(tick, 3000);
              return;
            }
            const data = await r.json();
            if (typeof data.expires_in === "number") {
              expEl.textContent = data.expires_in > 0 ? ("Expires in " + data.expires_in + "s") : "";
            }
            if (data.state === "confirmed") {
              statusEl.textContent = "Redirecting...";
              window.location.href = loginActionUrl;
              return;
            }
            if (data.state === "expired") {
              statusEl.textContent = "Your link has expired. Please request a new one.";
              expEl.textContent = "";
              return;
            }
            setTimeout(tick, 2500);
          } catch (e) {
            setTimeout(tick, 4000);
          }
        }

        tick();
      })();
    </script>
  </#if>
</@layout.registrationLayout>