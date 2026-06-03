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
                                <div style="font-size: 12px; color: #ffffff; margin-top: 6px;">CONFIRMATION LINK</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 38px 30px 10px 30px; color: #333333;">
                                <p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.6;">Hello<#if user.firstName??> ${user.firstName}</#if>,</p>
                                <h1 style="margin: 0 0 18px 0; font-size: 24px; font-weight: normal; line-height: 1.35; color: #0a9c8a;">Your sign-in link is ready</h1>
                                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6;">Use the button below to continue signing in to Regtransfers.</p>
                                <table role="presentation" align="center" style="margin: 0 auto 28px auto; border-collapse: collapse;">
                                    <tbody>
                                        <tr>
                                            <td style="background: #5bc0de; border-radius: 4px; padding: 16px 32px; text-align: center;">
                                                <a href="${magicLink}" style="color: #ffffff; text-decoration: none; font-size: 16px; letter-spacing: 0.5px; display: inline-block;">CONTINUE SIGN IN</a>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.6; color: #666666; text-align: center;">If the button does not work, copy and paste this link into your browser:</p>
                                <p style="margin: 0 0 24px 0; font-size: 12px; line-height: 1.6; color: #0a9c8a; word-break: break-all; text-align: center;">${magicLink}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
    </tbody>
</table>
</@layout.emailLayout>