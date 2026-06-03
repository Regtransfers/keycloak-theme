<#import "template.ftl" as layout>
<@layout.registrationLayout displayRequiredFields=false displayMessage=false displayInfo=false; section>
 <#if section = "header">
    <div style="font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: 0.2px;">Waiting for confirmation</div>
  <#elseif section = "form">
    <div style="background: rgba(16, 28, 56, 0.8); border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; padding: 22px; color: #ffffff;">
      <div style="font-size: 30px; margin-bottom: 12px; text-align: center;">⌛</div>
      <div id="mlc-status" style="font-size: 18px; text-align: center; margin-bottom: 8px;">Waiting for confirmation...</div>
      <div id="mlc-exp" style="font-size: 14px; text-align: center; color: rgba(255,255,255,0.85);"></div>
      <div style="margin-top: 14px;">
        <a href="${url.loginRestartFlowUrl}" style="display: inline-block; color: #ffcf4a; text-decoration: underline; text-underline-offset: 3px;">Try Another Way</a>
      </div>
    </div>
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