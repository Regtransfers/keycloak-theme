import { useState } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Template } from "../components/Template";

type LoginConfigTotpKcContext = Extract<KcContext, { pageId: "login-config-totp.ftl" }>;

type Props = {
    kcContext: LoginConfigTotpKcContext;
    i18n: I18n;
};

export default function LoginConfigTotp({ kcContext, i18n }: Props) {
    const { url, totp, messagesPerField } = kcContext;
    const { msgStr } = i18n;

    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

    const otpError = messagesPerField.existsError("totp", "userLabel");

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={
                <>
                    <p className="kc-display-heading font-bold font-[Roboto]">Set up authenticator</p>
                    <h1 className="text-[0.9375rem] font-normal text-white/80 mt-1 font-[Arimo]">
                        Scan the QR code with your authenticator app, then enter the code below
                    </h1>
                </>
            }
            displayMessage={!messagesPerField.existsError("totp", "userLabel")}
            displayInfo={false}
        >
            <form
                action={url.loginAction}
                method="post"
                onSubmit={() => setIsSubmitDisabled(true)}
                className="flex flex-col gap-4"
            >
                {/* QR code */}
                {totp.totpSecretQrCode && (
                    <div className="flex justify-center">
                        <img
                            src={`data:image/png;base64,${totp.totpSecretQrCode}`}
                            alt="OTP QR code"
                            className="w-40 h-40 rounded-lg bg-white p-2"
                        />
                    </div>
                )}

                {/* Manual entry key */}
                {totp.totpSecret && (
                    <div className="flex flex-col gap-1 text-center">
                        <p className="text-xs text-white/60">{msgStr("loginTotpUnableToScan")}</p>
                        <code className="text-sm font-mono tracking-widest text-white bg-white/10 rounded px-3 py-1 break-all">
                            {totp.totpSecret}
                        </code>
                    </div>
                )}

                {/* OTP code input */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="totp">
                        One-time code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="totp"
                        name="totp"
                        type="text"
                        inputSize="lg"
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        autoFocus
                        required
                        aria-invalid={otpError}
                    />
                    {otpError && (
                        <p className="text-sm text-destructive">
                            {messagesPerField.getFirstError("totp", "userLabel")}
                        </p>
                    )}
                </div>

                {/* Device name */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="userLabel">{msgStr("loginTotpDeviceName")}</Label>
                    <Input
                        id="userLabel"
                        name="userLabel"
                        type="text"
                        inputSize="lg"
                        autoComplete="off"
                    />
                </div>

                <input type="hidden" id="totpSecret" name="totpSecret" value={totp.totpSecret} />

                <Button
                    type="submit"
                    size="lg"
                    className="w-full mt-3 mb-4 border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d]"
                    disabled={isSubmitDisabled}
                    name="submitAction"
                    value="Save"
                >
                    Set up authenticator
                </Button>
            </form>
        </Template>
    );
}
