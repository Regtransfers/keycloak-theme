import type { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";

const APP_NAME = "Regtransfers";
const LOGO_URL = "https://images.regtransfers.co.uk/websiteimages/branding/logo-regtransfers@2x.png";
const SITE_URL = "https://www.regtransfers.co.uk";

type Props = {
    kcContext: KcContext & {
        pageId: string;
        url: { loginAction: string };
        message?: { type: "success" | "warning" | "error" | "info"; summary: string };
        isAppInitiatedAction?: boolean;
        auth?: { showUsername?: boolean; showResetCredentials?: boolean; attemptedUsername?: string; showTryAnotherWayLink?: boolean };
    };
    i18n: I18n;
    headerNode: ReactNode;
    displayMessage?: boolean;
    displayInfo?: boolean;
    infoNode?: ReactNode;
    socialProvidersNode?: ReactNode;
    children: ReactNode;
};

export function Template({
    kcContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    i18n: _i18n,
    headerNode,
    displayMessage = true,
    displayInfo = false,
    infoNode = null,
    socialProvidersNode = null,
    children,
}: Props) {
    const { message, isAppInitiatedAction } = kcContext;

    return (
        <TooltipProvider>
            {/* Full-screen background */}
            <div className="relative min-h-svh flex flex-col">
                {/* Car image background — decorative, must fill viewport */}
                <div
                    className="absolute inset-0 bg-cover bg-[80%_50%] md:bg-[75%_50%] lg:bg-[60%_50%]"
                    style={{ backgroundImage: "url('https://images.regtransfers.co.uk/websiteimages/banners/pages/porsche-gt3rs-white-jmr1-td.webp')" }}
                />
                {/* Navy overlay — decorative, must fill viewport */}
                <div className="absolute inset-0 bg-[#1a3060]/60" />

                {/* Main content area — grows to fill space, centres the form */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10">
                    {/* Logo above card */}
                    <div className="flex justify-center mb-6">
                        <a href={SITE_URL} target="_blank" rel="noopener noreferrer">
                            <img
                                src={LOGO_URL}
                                alt={APP_NAME}
                                className="h-12 w-auto"
                            />
                        </a>
                    </div>

                    <div className="w-full max-w-sm">
                        <Card className="border border-white/20 bg-white/10 dark:bg-black/50 shadow-2xl backdrop-blur-md text-white rounded-[1rem]">
                            <CardHeader>
                                <CardTitle className="text-2xl text-white">{headerNode}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Alert messages */}
                                    {displayMessage &&
                                        message !== undefined &&
                                        (message.type !== "warning" || !isAppInitiatedAction) && (
                                            <Alert
                                                variant={
                                                    message.type === "error" ? "destructive" : "default"
                                                }
                                            >
                                                <AlertDescription
                                                    dangerouslySetInnerHTML={{ __html: message.summary }}
                                                />
                                            </Alert>
                                        )}

                                    {/* Form content */}
                                    {children}

                                    {/* Social providers below form */}
                                    {socialProvidersNode}

                                    {/* Registration / info section */}
                                    {displayInfo && (
                                        <div className="text-center text-sm text-white/70">
                                            {infoNode}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                {/* Gold accent bar */}
                <div className="relative z-10 h-1 bg-[#F5C100]" />
                {/* Footer legal text — in normal flow, pushed to bottom */}
                <div className="relative z-10 w-full bg-black/40 backdrop-blur-sm">
                    <div className="max-w-4xl mx-auto px-6 py-3 text-white/60 text-[10px] leading-relaxed space-y-1">
                        <p>© 1982 - 2026 Registration Transfers Limited. All rights reserved. Registered in England. Company registration number 03933658. 'Regtransfers', 'Reg transfers' and the Regtransfers logo are registered trademarks of Registration Transfers Limited.</p>
                        <p>Credit subject to status and affordability. Terms &amp; Conditions apply (details). Registration Transfers Limited trading as Regtransfers.co.uk is authorised and regulated by the Financial Conduct Authority and is the broker and not the lender. Our registration number is 683825. Registration Transfers Limited offers credit products from Secure Trust Bank PLC trading as V12 Retail Finance. Credit is provided subject to affordability, age and status. Minimum spend applies. Not all products offered by Secure Trust Bank PLC are regulated by the Financial Conduct Authority.</p>
                    </div>
                </div>

                
            </div>
        </TooltipProvider>
    );
}