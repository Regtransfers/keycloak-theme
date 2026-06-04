import { useState } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Template } from "../components/Template";

type OtpFormKcContext = Extract<KcContext, { pageId: "otp-form.ftl" }>;

type Props = {
    kcContext: OtpFormKcContext;
    i18n: I18n;
};

export default function OtpForm({ kcContext, i18n }: Props) {
    const { auth, url, messagesPerField } = kcContext;
    const { msg, msgStr } = i18n;
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={
                <>
                    <p className="kc-display-heading font-bold font-[Roboto]">Verify code</p>
                    <h1 className="text-[0.9375rem] font-normal text-white/80 mt-1 font-[Arimo]">
                        {auth.attemptedUsername}
                    </h1>
                </>
            }
            displayMessage={false}
            displayInfo={false}
        >
            <form
                id="kc-otp-login-form"
                action={url.loginAction}
                method="post"
                onSubmit={() => setIsSubmitting(true)}
                className="flex flex-col gap-4"
            >
                <div className="flex flex-col gap-2">
                    <Label htmlFor="otp">{msg("loginOtpOneTime")}</Label>
                    <Input id="otp" name="otp" autoComplete="off" type="text" inputSize="lg" autoFocus />
                    {messagesPerField.existsError("totp") && (
                        <p className="text-sm text-destructive">{messagesPerField.getFirstError("totp")}</p>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        type="submit"
                        id="kc-submit"
                        name="submit"
                        size="lg"
                        className="flex-1 border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d]"
                        disabled={isSubmitting}
                    >
                        {msgStr("doSubmit")}
                    </Button>
                    <Button
                        type="submit"
                        id="kc-resend"
                        name="resend"
                        size="lg"
                        variant="outline"
                        className="flex-1 border-white/20 bg-white/8 text-white hover:bg-white/14 hover:text-white dark:border-white/20 dark:bg-white/8 dark:text-white dark:hover:bg-white/14"
                        disabled={isSubmitting}
                    >
                        {msgStr("doResend")}
                    </Button>
                </div>
            </form>

            <a
                href={url.loginRestartFlowUrl}
                className="text-center text-sm text-white/70 underline underline-offset-4 hover:text-white"
            >
                Try another way
            </a>
        </Template>
    );
}
