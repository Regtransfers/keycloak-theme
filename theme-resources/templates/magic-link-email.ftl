<#import "org/keycloak/freemarker/util.ftl" as util>
<#compress>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Sign in to Regtransfers</title>
    <style type="text/css">
        body { font-family: Helvetica, Arial, sans-serif; color: #333333; background-color: #f5f5f5; margin: 0; padding: 0; }
        table { border-collapse: collapse; }
        .email-container { max-width: 600px; background-color: #ffffff; margin: 0 auto; }
        .header { background-color: #1a1a1a; padding: 30px; text-align: center; }
        .header h1 { color: #ffdd00; margin: 0; font-size: 24px; font-weight: normal; letter-spacing: 1px; }
        .header p { color: #ffffff; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 0.5px; }
        .content { padding: 40px 30px; }
        .content h2 { margin: 0 0 20px 0; font-size: 22px; color: #0a9c8a; font-weight: normal; line-height: 1.4; }
        .content p { margin: 0 0 15px 0; font-size: 15px; line-height: 1.6; }
        .content .note { font-size: 13px; color: #666666; font-weight: bold; }
        .cta-button { background-color: #5bc0de; border-radius: 4px; padding: 16px 32px; display: inline-block; }
        .cta-button a { color: #ffffff; text-decoration: none; font-size: 16px; font-weight: normal; letter-spacing: 0.5px; }
        .cta-section { text-align: center; margin: 0 0 30px 0; }
        .security-box { background-color: #f9f9f9; border-left: 4px solid #0a9c8a; padding: 15px; margin-bottom: 30px; font-size: 13px; line-height: 1.6; color: #666666; }
        .security-box p { margin: 0; }
        .footer { background-color: #1a1a1a; padding: 30px; color: #ffffff; font-size: 12px; line-height: 1.6; text-align: center; }
        .footer a { color: #ffdd00; text-decoration: none; }
        .footer-social { margin: 15px 0; }
        .footer-social a { color: #ffffff; margin: 0 5px; font-size: 13px; text-decoration: none; }
        .link-text { word-break: break-all; color: #0a9c8a; }
    </style>
</head>
<body>
    <table role="presentation" width="100%" style="background-color: #f5f5f5; padding: 0; margin: 0;">
        <tbody>
            <tr>
                <td align="center" style="padding: 20px 0;">
                    <table role="presentation" class="email-container" width="100%" style="max-width: 600px; background-color: #ffffff;">
                        <tbody>
                            <!-- Header -->
                            <tr>
                                <td class="header">
                                    <h1>REGTRANSFERS</h1>
                                    <p>SECURE ACCESS</p>
                                </td>
                            </tr>

                            <!-- Content -->
                            <tr>
                                <td class="content">
                                    <p>Hello<#if user.firstName??> ${user.firstName}</#if>,</p>

                                    <h2>Click to sign in to your account</h2>

                                    <p>You've requested secure, passwordless access to your Regtransfers account. Click the button below to sign in instantly — no password needed.</p>

                                    <p class="note">⏰ This link expires in 15 minutes. If you didn't request this sign-in link, you can safely ignore this email.</p>

                                    <!-- CTA Button -->
                                    <div class="cta-section">
                                        <table role="presentation">
                                            <tbody>
                                                <tr>
                                                    <td class="cta-button">
                                                        <a href="${magicLink}">SIGN IN NOW</a>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <!-- Alternative link -->
                                    <p style="font-size: 13px; color: #666666; text-align: center; margin: 0 0 10px 0;">Or copy and paste this link into your browser:</p>
                                    <p style="font-size: 12px; text-align: center; margin: 0 0 30px 0;" class="link-text">
                                        <a href="${magicLink}" style="color: #0a9c8a; text-decoration: none;">${magicLink}</a>
                                    </p>

                                    <!-- Security info -->
                                    <div class="security-box">
                                        <p><strong style="color: #0a9c8a;">🔒 Your security matters:</strong> This link is unique and will only work once. Never share this email with anyone. We'll never ask for your password by email.</p>
                                    </div>

                                    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #666666;">
                                        Questions? Contact our support team at <a href="tel:01582969656" style="color: #0a9c8a; text-decoration: none;">01582 969656</a> or email <a href="mailto:support@regtransfers.co.uk" style="color: #0a9c8a; text-decoration: none;">support@regtransfers.co.uk</a>
                                    </p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td class="footer">
                                    <p style="margin: 0 0 15px 0;">
                                        <a href="https://www.regtransfers.co.uk">Visit our website</a>
                                        <span style="color: #666666;">•</span>
                                        <a href="https://www.regtransfers.co.uk/contact">Contact us</a>
                                    </p>
                                    <p class="footer-social">
                                        <a href="https://www.facebook.com/Regtransfers">f</a>
                                        <a href="https://twitter.com/Regtransfers">𝕏</a>
                                        <a href="https://www.instagram.com/regtransfers/">📷</a>
                                    </p>
                                    <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #999999;">
                                        © 2026 Reg Transfers Limited • 139 High Street South, Dunstable, Bedfordshire, LU6 3SS<br>
                                        Registered in England #12142971
                                    </p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
</body>
</html>
</#compress>
