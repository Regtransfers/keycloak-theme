<#import "template.ftl" as layout>
<@layout.emailLayout>
<table role="presentation" width="100%" style="background-color: #f5f5f5; margin: 0; padding: 0; border-collapse: collapse;">
    <tbody>
        <tr>
            <td align="center" style="padding: 24px 12px;">
                <table role="presentation" width="100%" style="max-width: 600px; background: #ffffff; border-collapse: collapse; font-family: Helvetica, Arial, sans-serif;">
                    <tbody>
                        <tr>
                            <td style="background: #1a1a1a; padding: 28px 30px; text-align: center;">
                                <div style="font-size: 22px; letter-spacing: 1px; color: #ffdd00;">REGTRANSFERS</div>
                                <div style="font-size: 12px; color: #ffffff; margin-top: 6px;">ONE-TIME CODE</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 38px 30px 10px 30px; color: #333333;">
                                <p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.6;">Hello<#if user.firstName??> ${user.firstName}</#if>,</p>
                                <h1 style="margin: 0 0 18px 0; font-size: 24px; font-weight: normal; line-height: 1.35; color: #0a9c8a;">Your one-time code</h1>
                                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6;">Use this code to finish signing in to your account:</p>
                                <div style="margin: 0 auto 28px auto; max-width: 240px; background: #f9f9f9; border: 1px solid #e6e6e6; border-radius: 6px; padding: 18px; text-align: center; font-size: 28px; letter-spacing: 0.18em; font-weight: bold; color: #1a1a1a;">${code}</div>
                                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #666666; text-align: center;">This code expires soon. If you didn't request it, you can ignore this email.</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
    </tbody>
</table>
</@layout.emailLayout>