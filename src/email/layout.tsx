import { ReactNode } from "react";

// Content styles for the branded white-background email wrapper
export const cs = {
    outerTd: {
        padding: "30px 30px 10px 30px",
        fontFamily: "Helvetica, Arial, sans-serif",
        backgroundColor: "#ffffff",
    },
    h1: {
        color: "#212529",
        fontSize: "26px",
        fontWeight: "300" as const,
        fontFamily: "Helvetica, Arial, sans-serif",
        lineHeight: "1.1",
        margin: "0 0 20px",
    },
    // Brand headline that sits under the "Hi there," salutation. Replaces h1 above
    // as each template is restyled. Pair with className="h1" so the wrapper's
    // mobile media query can shrink it.
    headline: {
        margin: "0px",
        padding: "0px",
        paddingBottom: "10px",
        fontFamily: "'Roboto', arial, sans-serif",
        fontSize: "42px",
        lineHeight: "110%",
        fontWeight: "normal" as const,
        color: "#0a9c8a",
    },
    p: {
        color: "#555555",
        fontSize: "15px",
        lineHeight: "1.6",
        margin: "0 0 16px",
        fontFamily: "Helvetica, Arial, sans-serif",
    },
    muted: {
        color: "#999999",
        fontSize: "13px",
        lineHeight: "1.6",
        margin: "20px 0 0",
        fontFamily: "Helvetica, Arial, sans-serif",
    },
    strong: {
        color: "#212529",
        fontWeight: "bold" as const,
    },
};

interface ButtonProps {
    href: string;
    children: ReactNode;
}

export const EmailButton = ({ href, children }: ButtonProps) => (
    <table cellSpacing={0} cellPadding={0} border={0} style={{ margin: "24px 0 8px" }}>
        <tbody>
            <tr>
                <td
                    className="button-td"
                    style={{ backgroundColor: "#339933", border: "1px solid #339933" }}
                >
                    <a
                        href={href}
                        className="cta-button button-link"
                        style={{
                            display: "inline-block",
                            color: "#ffffff",
                            fontFamily: "Helvetica, Arial, sans-serif",
                            fontSize: "15px",
                            fontWeight: "bold",
                            textDecoration: "none",
                            padding: "12px 24px",
                        }}
                    >
                        {children}
                    </a>
                </td>
            </tr>
        </tbody>
    </table>
);

interface EventAlertProps {
    date: string;
    ipAddress: string;
}

export const EventAlert = ({ date, ipAddress }: EventAlertProps) => (
    <table
        cellSpacing={0}
        cellPadding={0}
        border={0}
        style={{ border: "1px solid #eaeaea", margin: "16px 0", width: "100%" }}
    >
        <tbody>
            <tr>
                <td style={{ padding: "16px 20px", backgroundColor: "#f8f9fa", fontFamily: "Helvetica, Arial, sans-serif" }}>
                    <p style={{ color: "#999999", fontSize: "12px", textTransform: "uppercase" as const, letterSpacing: "0.05em", margin: "0 0 2px" }}>Date</p>
                    <p style={{ color: "#212529", fontSize: "14px", margin: "0 0 12px" }}>{date}</p>
                    <p style={{ color: "#999999", fontSize: "12px", textTransform: "uppercase" as const, letterSpacing: "0.05em", margin: "0 0 2px" }}>IP Address</p>
                    <p style={{ color: "#212529", fontSize: "14px", margin: "0" }}>{ipAddress}</p>
                </td>
            </tr>
        </tbody>
    </table>
);

// "Kind regards" block that closes every email, above the footer. Used by
// EmailWrapper for HTML and by templates' plain-text renders.
// Visible email addresses are data-skip so plain text prints the address once
// (from the mailto: href) rather than "address address".
export const SignOff = () => (
    <tr>
        <td style={{ margin: "0px", padding: "40px 30px 100px 30px", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "15px", lineHeight: "150%", background: "#ffffff", color: "#333333" }}>
            <p style={{ margin: "0px", padding: "0px", paddingBottom: "15px" }}>Kind regards,</p>
            <p style={{ margin: "0px", padding: "0px", paddingBottom: "5px" }}><strong>The Regtransfers Team</strong></p>
            <p style={{ margin: "0px", padding: "0px", paddingBottom: "5px" }}>Tel: <a href="tel:01582967777" style={{ color: "#000000" }}><span style={{ color: "#000000" }}><u>01582 967777</u></span></a></p>
            <p style={{ margin: "0px", padding: "0px" }}>Email: <a href="mailto:sales@regtransfers.co.uk" style={{ color: "#000000" }}><span data-skip="true" style={{ color: "#000000" }}><u>sales@regtransfers.co.uk</u></span></a></p>
        </td>
    </tr>
);
