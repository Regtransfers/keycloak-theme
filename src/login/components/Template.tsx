import type { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";

const APP_NAME = "My App";

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
    i18n,
    headerNode,
    displayMessage = true,
    displayInfo = false,
    infoNode = null,
    socialProvidersNode = null,
    children,
}: Props) {
    const { message, isAppInitiatedAction } = kcContext;
    const { msgStr } = i18n;

    return (
        <TooltipProvider>
            <div className="grid min-h-svh lg:grid-cols-2">
                {/* ── Left column: form ── */}
                <div className="relative flex min-h-screen flex-col px-4 py-6 lg:min-h-0 lg:p-10">
                    {/* Back-to-app link (top-left) */}
                    <div className="absolute top-4 left-4 z-20">
                        <span className="font-semibold text-sm">{APP_NAME}</span>
                    </div>

                    {/* Centered form area */}
                    <div className="flex flex-1 items-center justify-center">
                        <div className="w-full max-w-sm">
                            <Card className="shadow-none border-0 bg-transparent lg:border lg:shadow-sm lg:bg-card">
                                <CardHeader>
                                    <CardTitle className="text-2xl">{headerNode}</CardTitle>
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
                                            <div className="text-center text-sm text-muted-foreground">
                                                {infoNode}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* ── Right column: branding panel ── */}
                <div className="bg-primary relative hidden lg:flex lg:flex-col lg:items-center lg:justify-center">
                    <div className="flex flex-col items-center gap-4 px-8 text-center">
                        {/* Logo placeholder */}
                        <div className="flex size-16 items-center justify-center rounded-full bg-primary-foreground/10">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="size-8 text-primary-foreground"
                            >
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="text-2xl font-semibold text-primary-foreground">
                            {APP_NAME}
                        </span>
                        <p className="text-sm text-primary-foreground/70 max-w-xs">
                            {msgStr("welcomeMessage")}
                        </p>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
