import { ReactNode } from "react";

// Content styles for the branded white-background email wrapper
export const cs = {
    outerTd: {
        padding: "30px 30px 10px 30px",
        fontFamily: "Arial, Helvetica, sans-serif",
        backgroundColor: "#ffffff",
    },
    h1: {
        color: "#212529",
        fontSize: "26px",
        fontWeight: "300" as const,
        fontFamily: "Roboto, Helvetica, Arial, sans-serif",
        lineHeight: "1.1",
        margin: "0 0 20px",
    },
    p: {
        color: "#555555",
        fontSize: "15px",
        lineHeight: "1.6",
        margin: "0 0 16px",
        fontFamily: "Arial, Helvetica, sans-serif",
    },
    muted: {
        color: "#999999",
        fontSize: "13px",
        lineHeight: "1.6",
        margin: "20px 0 0",
        fontFamily: "Arial, Helvetica, sans-serif",
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
                    style={{ backgroundColor: "#339933", borderRadius: "4px", border: "1px solid #339933" }}
                >
                    <a
                        href={href}
                        className="cta-button button-link"
                        style={{
                            display: "inline-block",
                            color: "#ffffff",
                            fontFamily: "Arial, Helvetica, sans-serif",
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
        style={{ border: "1px solid #eaeaea", borderRadius: "4px", margin: "16px 0", width: "100%" }}
    >
        <tbody>
            <tr>
                <td style={{ padding: "16px 20px", backgroundColor: "#f8f9fa", fontFamily: "Arial, Helvetica, sans-serif" }}>
                    <p style={{ color: "#999999", fontSize: "12px", textTransform: "uppercase" as const, letterSpacing: "0.05em", margin: "0 0 2px" }}>Date</p>
                    <p style={{ color: "#212529", fontSize: "14px", margin: "0 0 12px" }}>{date}</p>
                    <p style={{ color: "#999999", fontSize: "12px", textTransform: "uppercase" as const, letterSpacing: "0.05em", margin: "0 0 2px" }}>IP Address</p>
                    <p style={{ color: "#212529", fontSize: "14px", margin: "0" }}>{ipAddress}</p>
                </td>
            </tr>
        </tbody>
    </table>
);
