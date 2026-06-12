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
                {/* Animated Figma-style gradient background */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Base dark blue gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0f1b35] via-[#1a2a4a] to-[#1a3060]" />
                    
                    {/* Animated floating yellow orb */}
                    <div className="absolute -top-1/2 -left-1/2 w-[600px] h-[600px] rounded-full blur-[150px] opacity-40 bg-yellow-300" 
                         style={{ animation: 'float 25s ease-in-out infinite' }} />
                    
                    {/* Animated floating white orb */}
                    <div className="absolute -bottom-1/2 -right-1/3 w-[700px] h-[700px] rounded-full blur-[160px] opacity-35 bg-white" 
                         style={{ animation: 'float 30s ease-in-out infinite 3s' }} />
                    
                    {/* Yellow accent orb */}
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] opacity-25 bg-yellow-200" 
                         style={{ animation: 'float 22s ease-in-out infinite 5s' }} />
                </div>

                {/* Subtle overlay for depth */}
                <div className="absolute inset-0 bg-black/5 dark:bg-black/10" />

                {/* Main content area — grows to fill space, centres the form */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10">
                    {/* Logo above card */}
                    <div className="flex justify-center mb-6">
                        <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="border-0">
                            <img
                                src={LOGO_URL}
                                alt={APP_NAME}
                                className="h-12 w-auto"
                            />
                        </a>
                    </div>

                    <div className="w-full max-w-md">
                        <Card className="border border-white/20 bg-white/10 dark:bg-black/50 shadow-2xl backdrop-blur-md text-white rounded-[1rem] px-3">
                            <CardHeader>
                                <CardTitle className="text-white">{headerNode}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Alert messages */}
                                    {displayMessage &&
                                        message !== undefined &&
                                        (message.type !== "warning" || !isAppInitiatedAction) && (
                                            <Alert
                                                variant={
                                                    message.type === "error" ? "inline" : "default"
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
                <div className="relative z-10 w-full bg-[#212529]">
                    <div className="max-w-6xl mx-auto px-6 py-4 text-white/60 text-[12px] leading-relaxed space-y-1">
                        <p>© 1982 - 2026 Registration Transfers Limited. All rights reserved. Registered in England. Company registration number 03933658. 'Regtransfers', 'Reg transfers' and the Regtransfers logo are registered trademarks of Registration Transfers Limited.</p>
                        <p>Credit subject to status and affordability. Terms &amp; Conditions apply (<a href="https://www.regtransfers.co.uk/company/terms#finance" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/90">details</a>). Registration Transfers Limited trading as Regtransfers.co.uk is authorised and regulated by the Financial Conduct Authority and is the broker and not the lender. Our registration number is 683825. Registration Transfers Limited offers credit products from Secure Trust Bank PLC trading as V12 Retail Finance. Credit is provided subject to affordability, age and status. Minimum spend applies. Not all products offered by Secure Trust Bank PLC are regulated by the Financial Conduct Authority.</p>
                    </div>
                </div>

                
            </div>
        </TooltipProvider>
    );
}