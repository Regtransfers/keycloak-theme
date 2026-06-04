import { ReactNode } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const CSS = `
    @font-face {
        font-family:'Roboto';
        font-style:normal;
        font-weight:400;
        src: local('Roboto'), local('Roboto-Regular'), url(https://fonts.gstatic.com/s/roboto/v18/ek4gzZ-GeXAPcSbHtCeQI_esZW2xOQ-xsNqO47m55DA.woff2) format('woff2');
        unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
        mso-font-alt: 'Arial';
    }
    html, body { margin: 0 auto !important; padding: 0 !important; height: 100% !important; width: 100% !important; }
    * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    .ReadMsgBody, .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div, .ExternalClass * { line-height: 140%; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
    table .payment { border-color: #339933 !important; }
    h1.h1, h2, .h2, h3, .h3 { color: #212529; font-weight: normal; font-weight: 300; font-family: 'Roboto', helvetica, arial, sans-serif; line-height: 1.1 !important; }
    h1, .h1 { font-size: 32px; }
    h2, .h2 { font-size: 24px; }
    h3, .h3 { font-size: 21px; }
    @media only screen and (max-width:440px) {
        h1, .h1 { font-size: 24px !important; }
        h2, .h2 { font-size: 21px !important; }
        h3, .h3 { font-size: 18px !important; }
    }
    p.lead { font-size: 21px; font-weight: normal; color: #999999; }
    .price { color: #5cb85c; }
    .price-xl { font-size: 48px; font-weight: normal; font-family: 'Roboto', helvetica, arial, sans-serif; }
    div[style*="margin: 16px 0"] { margin: 0 !important; }
    table { border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important; }
    table table table { table-layout: auto; }
    table td[class="column"] { width: 50%; }
    *[x-apple-data-detectors], .x-gmail-data-detectors, .x-gmail-data-detectors *, .aBn {
        border-bottom: 0 !important; cursor: default !important; color: inherit !important;
        text-decoration: none !important; font-size: inherit !important; font-family: inherit !important;
        font-weight: inherit !important; line-height: inherit !important;
    }
    .a6S { display: none !important; opacity: 0.01 !important; }
    img.g-img + div { display: none !important; }
    .button-link { text-decoration: none !important; }
    .appleBody a { color: #0066b3; text-decoration: none; }
    .appleFooter a { color: #ffffff; text-decoration: none; }
    @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
        .email-container { min-width: 375px !important; }
    }
    @media screen and (max-width:480px) {
        u ~ div .email-container { min-width: 100vw; }
        table td[class="column"] { width: 100% !important; display: block !important; text-align: center !important; padding: 10px 0px 10px 0px !important; }
        table td[class="column"] img.logo { padding-top: 20px !important; margin: 0 auto; }
        table[class="cta-button-container"] { margin: 0 auto; width: 100% !important; }
        a[class="cta-button"] { width: 80% !important; padding: 15px !important; border: 0 !important; font-size: 16px !important; }
    }
    @media only screen and (max-width:414px) {
        table td.column { width: 100% !important; display: block !important; text-align: center !important; padding: 0px 0px 10px 0px !important; margin-left: auto !important; margin-right: auto !important; }
        table td.column img.logo { padding-top: 15px !important; margin: 0 auto; }
        .bullet-separator { display: none !important; }
    }
    .button-td, .cta-button { transition: all 250ms ease-in-out; }
    .button-td:hover, .cta-button:hover { background: #339933 !important; border-color: #339933 !important; }
    @media screen and (max-width: 600px) {
        .email-container p { font-size: 15px !important; }
    }
`;

// Shorthand to spread non-standard HTML attributes TypeScript doesn't type
const a = (attrs: Record<string, any>) => attrs as any;

export function EmailWrapper({ children }: { children: ReactNode }) {
    const year = new Date().getFullYear();
    return (
        <html lang="en">
        <head>
            <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
            <meta name="x-apple-disable-message-reformatting" />
            <title></title>
            <link href="https://fonts.googleapis.com/css?family=Roboto:400" rel="stylesheet" type="text/css" />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
        </head>
        <body {...a({ width: "100%", bgcolor: "#f1f1f1" })} style={{ margin: "0", minWidth: "100%" }}>
            <center style={{ width: "100%", background: "#f1f1f1", textAlign: "left" }}>
                <div style={{ maxWidth: "600px", margin: "auto" }}>

                    {/* Email Header */}
                    <table {...a({ id: "emailHeader", role: "presentation", bgcolor: "#1a1a1a", cellSpacing: "0", cellPadding: "0", border: "0", align: "center", valign: "top", width: "100%", class: "email-header" })} style={{ width: "100%", maxWidth: "600px", backgroundColor: "#1a1a1a" }}>
                        <tbody>
                            <tr>
                                <td {...a({ class: "column", valign: "middle" })} style={{ padding: "20px 30px 20px 30px", textAlign: "left" }}>
                                    <a {...a({ name: "rt-logo" })} href="https://www.regtransfers.co.uk?utm_source=marketing&utm_medium=email&utm_campaign=keycloak">
                                        <img src="https://images.regtransfers.co.uk/websiteimages/branding/logo-regtransfers@2x.png" width={200} height={40} alt="Regtransfers" {...a({ border: "0", class: "logo" })} style={{ display: "block", height: "auto", backgroundColor: "#1a1a1a", fontFamily: "sans-serif", fontSize: "15px", lineHeight: "1.5", color: "#ffffff" }} />
                                    </a>
                                </td>
                                <td {...a({ class: "column", valign: "middle" })} style={{ padding: "20px 30px 20px 30px", textAlign: "right" }}>
                                    <a {...a({ name: "header-tel", id: "header-tel", class: "masthead-telephone-number" })} href="tel:01582967777" style={{ textDecoration: "none", color: "#ffcc00", display: "block", lineHeight: "125%" }}>
                                        <span style={{ display: "inline-block", color: "#ffcc00", fontFamily: "sans-serif", fontSize: "18px", lineHeight: "100%" }}>01582 967777</span>
                                    </a>
                                    <span {...a({ class: "header-opening-times" })} style={{ display: "block", color: "#ffffff", fontFamily: "sans-serif", fontSize: "12px" }}>9am-9pm, 7 days a week</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Divider */}
                    <table {...a({ cellSpacing: "0", cellPadding: "0", border: "0", width: "100%" })} style={{ width: "100%", maxWidth: "600px" }}>
                        <tbody>
                            <tr>
                                <td align="left" {...a({ valign: "top", width: "100%", height: "1" })} style={{ backgroundColor: "#eaeaea", borderCollapse: "collapse", lineHeight: "1px" }} />
                            </tr>
                        </tbody>
                    </table>

                    {/* Email Body */}
                    <table {...a({ role: "presentation", bgcolor: "#ffffff", cellSpacing: "0", cellPadding: "0", border: "0", align: "center", width: "100%" })} style={{ width: "100%", maxWidth: "600px", backgroundColor: "white" }}>
                        <tbody>
                            <tr>
                                <td {...a({ valign: "top" })}>
                                    <table {...a({ role: "presentation", cellSpacing: "0", cellPadding: "0", border: "0", align: "center", width: "100%" })}>
                                        <tbody>
                                            {children}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td {...a({ "aria-hidden": "true", height: "30" })} style={{ fontSize: "0", lineHeight: "0" }}>&nbsp;</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Footer */}
                    <table {...a({ id: "emailFooter", role: "presentation", class: "footer", bgcolor: "#1a1a1a", cellSpacing: "0", cellPadding: "0", border: "0", align: "center", width: "100%" })} style={{ width: "100%", maxWidth: "600px", backgroundColor: "#1a1a1a" }}>
                        <tbody>
                            {/* 1. 40Y Wreath */}
                            <tr>
                                <td align="center" style={{ padding: "30px 0px 10px 0px", textAlign: "center" }}>
                                    <img src="https://images.regtransfers.co.uk/email/icons/wreath-40y-email.png" {...a({ height: "48", width: "96", border: "0", class: "g-img" })} alt="Serving the UK with private registrations for 40 Years" />
                                </td>
                            </tr>
                            {/* 2. Trustpilot */}
                            <tr>
                                <td align="center" style={{ padding: "10px 10px 10px 10px", fontFamily: "Helvetica, Arial, sans-serif", lineHeight: "140%", textAlign: "center", color: "white", fontSize: "15px" }}>
                                    <table {...a({ role: "presentation", bgcolor: "#1a1a1a", cellSpacing: "0", cellPadding: "0", border: "0", align: "center", width: "auto" })} style={{ width: "auto", margin: "0 auto", backgroundColor: "#1a1a1a" }}>
                                        <tbody>
                                            <tr>
                                                <td align="center" style={{ margin: "0px", padding: "15px 20px", borderTop: "1px dotted #666666", borderBottom: "1px dotted #666666" }}>
                                                    <center>
                                                        <a href="https://uk.trustpilot.com/review/www.regtransfers.co.uk" style={{ textDecoration: "none" }}>
                                                            <span style={{ display: "block", textAlign: "center" }}>
                                                                <img {...a({ class: "g-img" })} src="https://images.regtransfers.co.uk/email/graphics/tp/Trustpilot_brandmark_gr-wht_RGB-144x36-M.png" {...a({ border: "0", width: "128", height: "32" })} alt="Trustpilot Logo" style={{ maxHeight: "32px", display: "inline-block" }} />
                                                            </span>
                                                            <span style={{ display: "inline-block", paddingTop: "10px" }}>
                                                                <img src="https://emailsignature.trustpilot.com/newsletter/en-US/1/48fbeca6000064000503d4bc/text1_dark@2x.png" {...a({ border: "0", height: "18" })} alt="Human score" style={{ maxHeight: "18px" }} />&nbsp;
                                                                <img src="https://images.regtransfers.co.uk/email/graphics/tp/stars@2x.png" {...a({ border: "0", height: "18", width: "96" })} alt="Trustpilot Stars" style={{ maxHeight: "18px" }} />&nbsp;
                                                                <img {...a({ class: "g-img" })} src="https://emailsignature.trustpilot.com/newsletter/en-GB/1/48fbeca6000064000503d4bc/text2_dark@2x.png" {...a({ border: "0", height: "18" })} alt="Number of reviews" style={{ maxHeight: "18px" }} />
                                                            </span>
                                                        </a>
                                                    </center>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            {/* 3. Social Media */}
                            <tr>
                                <td align="center" style={{ padding: "10px 0px 10px 0px", textAlign: "center" }}>
                                    <center>
                                        <table {...a({ role: "presentation", bgcolor: "#1a1a1a", cellSpacing: "0", cellPadding: "0", border: "0", align: "center", width: "auto" })} style={{ width: "auto", color: "#ffffff", backgroundColor: "#1a1a1a" }}>
                                            <tbody>
                                                <tr>
                                                    <td align="center" style={{ padding: "3px 5px" }}>
                                                        <a href="https://www.facebook.com/Regtransfers" target="_blank" rel="noreferrer" title="We are on Facebook">
                                                            <img src="https://images.regtransfers.co.uk/email/icons/ico32/mono/ico32-facebook-mono.png" {...a({ height: "32", width: "32", border: "0", class: "g-img" })} alt="Facebook logo" />
                                                        </a>
                                                    </td>
                                                    <td align="center" style={{ padding: "3px 5px" }}>
                                                        <a href="https://twitter.com/Regtransfers" target="_blank" rel="noreferrer" title="We are on X">
                                                            <img src="https://images.regtransfers.co.uk/email/icons/ico32/mono/ico32-x-mono.png" {...a({ height: "32", width: "32", border: "0", class: "g-img" })} alt="X (formerly Twitter) logo" />
                                                        </a>
                                                    </td>
                                                    <td align="center" style={{ padding: "3px 5px" }}>
                                                        <a href="https://www.instagram.com/regtransfers/" target="_blank" rel="noreferrer" title="We are on Instagram">
                                                            <img src="https://images.regtransfers.co.uk/email/icons/ico32/mono/ico32-instagram-mono.png" {...a({ height: "32", width: "32", border: "0", class: "g-img" })} alt="Instagram logo" />
                                                        </a>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </center>
                                </td>
                            </tr>
                            {/* 4. Contact information */}
                            <tr>
                                <td {...a({ valign: "top", align: "center" })} style={{ padding: "0px 15px 30px 15px", fontFamily: "Helvetica, Arial, sans-serif", lineHeight: "140%", textAlign: "center", color: "#ffffff", fontSize: "13px" }}>
                                    <p style={{ margin: "0", padding: "0", paddingBottom: "15px", fontSize: "13px" }}>
                                        E: <a href="mailto:sales@regtransfers.co.uk" style={{ color: "#ffdd00" }}>sales@regtransfers.co.uk</a>{" "}
                                        <span style={{ color: "white" }} {...a({ class: "bullet-separator" })}>&bull;</span>{" "}
                                        <span style={{ whiteSpace: "nowrap" }}>T: <a style={{ color: "#ffdd00" }} href="tel:01582967777">01582 967777</a></span>
                                    </p>
                                    <p style={{ margin: "0", padding: "0", paddingBottom: "10px", color: "#fff", lineHeight: "1.5", fontSize: "11px" }}>
                                        &copy; <span style={{ color: "white", textDecoration: "none" }}>{year}</span> Reg Transfers Limited.<br />
                                        <a href="https://www.regtransfers.co.uk" style={{ color: "#ffffff", textDecoration: "none" }}>139 High Street South, Dunstable, <span style={{ whiteSpace: "nowrap" }}>Bedfordshire, LU6 3SS</span></a>.<br />
                                        Registered in England <span style={{ color: "white", textDecoration: "none" }}>#12142971</span>
                                    </p>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Compliance */}
                    <table {...a({ role: "presentation", bgcolor: "#eaeaea", cellSpacing: "0", cellPadding: "0", border: "0", align: "left", width: "100%" })} style={{ maxWidth: "600px", backgroundColor: "#eaeaea" }}>
                        <tbody>
                            <tr>
                                <td {...a({ valign: "top", align: "center" })} style={{ padding: "15px 15px 75px 15px", fontFamily: "Helvetica, Arial, sans-serif", textAlign: "left", color: "#cccccc", fontSize: "11px" }}>
                                    <p style={{ margin: "0", padding: "0", lineHeight: "1.5", fontSize: "11px", color: "#333333" }}>
                                        Images are for illustrative purposes only. You are receiving this email as an existing customer and this notice is sent as a courtesy.
                                    </p>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                </div>
            </center>
        </body>
        </html>
    );
}
