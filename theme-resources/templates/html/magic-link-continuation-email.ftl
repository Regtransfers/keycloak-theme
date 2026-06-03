<#import "template.ftl" as layout>
<@layout.emailLayout>
<p>Hello<#if user.firstName??> ${user.firstName}</#if>,</p>
<p>Your sign-in link is ready.</p>
<p><a href="${magicLink}">Continue sign in</a></p>
<p>If the button does not work, copy and paste this link into your browser:</p>
<p>${magicLink}</p>
</@layout.emailLayout>