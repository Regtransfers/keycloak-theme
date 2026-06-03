<#import "template.ftl" as layout>
<@layout.emailLayout>
<p>Hello<#if user.firstName??> ${user.firstName}</#if>,</p>
<p>Use this code to finish signing in:</p>
<p><strong>${code}</strong></p>
<p>This code expires soon. If you did not request it, you can ignore this email.</p>
</@layout.emailLayout>