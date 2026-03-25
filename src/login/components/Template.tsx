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
            <div className="relative min-h-svh flex flex-col items-center justify-center overflow-hidden">
                {/* Car image background */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('https://images.regtransfers.co.uk/websiteimages/banners/pages/porsche-gt3rs-white-jmr1-td.webp')" }}
                />
                {/* Navy overlay */}
                <div className="absolute inset-0 bg-[#1a3060]/60" />
                {/* Gold accent bar */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-[#F5C100]" />

                {/* Glassmorphism form card */}
                <div className="relative z-10 w-full max-w-sm mx-4">
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

                    <Card className="border border-white/20 bg-white/10 dark:bg-black/50 shadow-2xl backdrop-blur-md text-white">
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

                                {/* Social providers above form */}
                                {socialProvidersNode}

                                {/* Form content */}
                                {children}

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
        </TooltipProvider>
    );
}