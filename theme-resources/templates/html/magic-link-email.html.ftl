<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign in to Regtransfers</title>
</head>
<body style="font-family: Helvetica, Arial, sans-serif; color: #333333; background-color: #f5f5f5; margin: 0; padding: 0;">

<!-- Outer container -->
<table role="presentation" width="100%" style="background-color: #f5f5f5; padding: 0; margin: 0;">
    <tbody>
        <tr>
            <td align="center" style="padding: 20px 0;">
                <!-- Email wrapper (max-width 600px) -->
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse;">
                    <tbody>
                        <!-- Header section -->
                        <tr>
                            <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
                                <h1 style="color: #ffdd00; margin: 0; font-size: 24px; font-weight: normal; letter-spacing: 1px;">REGTRANSFERS</h1>
                                <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 0.5px;">SECURE ACCESS</p>
                            </td>
                        </tr>

                        <!-- Main content -->
                        <tr>
                            <td style="padding: 40px 30px; color: #333333;">
                                <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                                    Hello<#if user.firstName??> ${user.firstName}</#if>,
                                </p>

                                <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #0a9c8a; font-weight: normal; line-height: 1.4;">
                                    Click to sign in to your account
                                </h2>

                                <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6;">
                                    You've requested secure, passwordless access to your Regtransfers account. Click the button below to sign in instantly — no password needed.
                                </p>

                                <p style="margin: 0 0 30px 0; font-size: 13px; line-height: 1.6; color: #666666;">
                                    <strong>This link expires in 15 minutes.</strong> If you didn't request this sign-in link, you can safely ignore this email.
                                </p>

                                <!-- CTA Button -->
                                <table role="presentation" width="100%" style="margin: 0 0 30px 0;">
                                    <tbody>
                                        <tr>
                                            <td align="center">
                                                <table role="presentation" style="background-color: #5bc0de; border-radius: 4px;">
                                                    <tbody>
                                                        <tr>
                                                            <td style="padding: 16px 32px;">
                                                                <a href="${link}" style="display: inline-block; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: normal; letter-spacing: 0.5px;">
                                                                    SIGN IN NOW
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                <!-- Alternative link -->
                                <p style="margin: 0 0 10px 0; font-size: 13px; line-height: 1.6; color: #666666; text-align: center;">
                                    Or copy and paste this link into your browser:
                                </p>
                                <p style="margin: 0 0 30px 0; font-size: 12px; line-height: 1.6; color: #0a9c8a; word-break: break-all; text-align: center;">
                                    <a href="${link}" style="color: #0a9c8a; text-decoration: none;">${link}</a>
                                </p>

                                <!-- Security info -->
                                <div style="background-color: #f9f9f9; border-left: 4px solid #0a9c8a; padding: 15px; margin-bottom: 30px; font-size: 13px; line-height: 1.6; color: #666666;">
                                    <p style="margin: 0;">
                                        <strong style="color: #0a9c8a;">Your security matters:</strong> This link is unique and will only work once. Never share this email with anyone. We'll never ask for your password by email.
                                    </p>
                                </div>

                                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #666666;">
                                    Questions? Contact our support team at <a href="tel:01582969656" style="color: #0a9c8a; text-decoration: none;">01582 969656</a> or email <a href="mailto:support@regtransfers.co.uk" style="color: #0a9c8a; text-decoration: none;">support@regtransfers.co.uk</a>
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #1a1a1a; padding: 30px; color: #ffffff; font-size: 12px; line-height: 1.6; text-align: center;">
                                <p style="margin: 0 0 15px 0;">
                                    <a href="https://www.regtransfers.co.uk" style="color: #ffdd00; text-decoration: none; margin: 0 10px;">Visit our website</a>
                                    <span style="color: #666666;">•</span>
                                    <a href="https://www.regtransfers.co.uk/contact" style="color: #ffdd00; text-decoration: none; margin: 0 10px;">Contact us</a>
                                </p>
                                <p style="margin: 0 0 15px 0; color: #cccccc;">
                                    <a href="https://www.facebook.com/Regtransfers" style="color: #ffffff; text-decoration: none; margin: 0 5px; font-size: 13px;">f</a>
                                    <a href="https://twitter.com/Regtransfers" style="color: #ffffff; text-decoration: none; margin: 0 5px; font-size: 13px;">𝕏</a>
                                    <a href="https://www.instagram.com/regtransfers/" style="color: #ffffff; text-decoration: none; margin: 0 5px; font-size: 13px;">📷</a>
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
