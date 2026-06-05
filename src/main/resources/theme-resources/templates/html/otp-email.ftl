<#import "template.ftl" as layout>
<@layout.emailLayout>
<p>Someone requested a one-time-password to login to ${realmName!"your account"}.</p>
<p><strong>Code: ${code}</strong></p>
<p>If you did not request this code, please ignore this email.</p>
</@layout.emailLayout>