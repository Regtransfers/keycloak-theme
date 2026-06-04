import { useRef, useState } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Template } from "../components/Template";
import { cn } from "@/lib/utils";

function OtpSegmentedInput({
    id,
    name,
    autoFocus,
    hasError,
}: {
    id: string;
    name: string;
    autoFocus?: boolean;
    hasError?: boolean;
}) {
    const [cells, setCells] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const focusCell = (i: number) => {
        inputRefs.current[Math.max(0, Math.min(5, i))]?.focus();
    };

    const handleChange = (i: number, raw: string) => {
        const chars = raw.replace(/\D/g, "");
        if (!chars) {
            setCells(prev => { const n = [...prev]; n[i] = ""; return n; });
            return;
        }
        const char = chars.slice(-1);
        setCells(prev => { const n = [...prev]; n[i] = char; return n; });
        if (i < 5) focusCell(i + 1);
    };

    const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault();
            if (cells[i]) {
                setCells(prev => { const n = [...prev]; n[i] = ""; return n; });
            } else if (i > 0) {
                setCells(prev => { const n = [...prev]; n[i - 1] = ""; return n; });
                focusCell(i - 1);
            }
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            focusCell(i - 1);
        } else if (e.key === "ArrowRight") {
            e.preventDefault();
            focusCell(i + 1);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        setCells(prev => prev.map((_, i) => pasted[i] ?? ""));
        focusCell(Math.min(pasted.length, 5));
    };

    return (
        <div className="flex gap-2 sm:gap-otp justify-start w-full">
            <input type="hidden" id={id} name={name} value={cells.join("")} readOnly />
            {cells.map((char, i) => (
                <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    autoFocus={autoFocus && i === 0}
                    maxLength={1}
                    value={char}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    onFocus={e => e.target.select()}
                    aria-invalid={hasError}
                    className={cn(
                        "flex-1 min-w-0 h-11 text-center rounded-lg border text-base font-mono bg-transparent text-white transition-colors outline-none",
                        "border-input focus:border-ring focus:ring-3 focus:ring-ring/50",
                        hasError && "border-destructive ring-3 ring-destructive/20"
                    )}
                />
            ))}
        </div>
    );
}

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
                    <OtpSegmentedInput
                        id="otp"
                        name="otp"
                        autoFocus
                        hasError={messagesPerField.existsError("totp")}
                    />
                    {messagesPerField.existsError("totp") && (
                        <p className="text-sm text-destructive">{messagesPerField.getFirstError("totp")}</p>
                    )}
                </div>

                <div className="flex gap-3">
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
