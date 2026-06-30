import { useEffect, useRef, useState } from "react";
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
    onComplete,
}: {
    id: string;
    name: string;
    autoFocus?: boolean;
    hasError?: boolean;
    onComplete?: () => void;
}) {
    const [cells, setCells] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const autofillInputRef = useRef<HTMLInputElement | null>(null);
    const hasNotifiedCompleteRef = useRef(false);

    useEffect(() => {
        const isComplete = cells.every(cell => cell !== "");

        if (isComplete && !hasNotifiedCompleteRef.current) {
            hasNotifiedCompleteRef.current = true;
            onComplete?.();
            return;
        }

        if (!isComplete) {
            hasNotifiedCompleteRef.current = false;
        }
    }, [cells, onComplete]);

    // Handle autofill from browser/device (iOS, Android, password managers)
    const handleAutofill = (e: React.ChangeEvent<HTMLInputElement>) => {
        const autofilled = e.target.value.replace(/\D/g, "").slice(0, 6);
        if (autofilled.length > 0) {
            setCells(prev => prev.map((_, i) => autofilled[i] ?? ""));
        }
    };

    const focusCell = (i: number) => {
        inputRefs.current[Math.max(0, Math.min(5, i))]?.focus();
    };

    const handleChange = (i: number, raw: string) => {
        const chars = raw.replace(/\D/g, "");
        if (!chars) {
            setCells(prev => { const n = [...prev]; n[i] = ""; return n; });
            return;
        }
        if (chars.length > 1) {
            // Autofill (iOS/Android one-time-code) delivers the full code into one cell
            setCells(prev => prev.map((c, idx) => idx >= i ? (chars[idx - i] ?? c) : c));
            focusCell(Math.min(i + chars.length - 1, 5));
            return;
        }
        setCells(prev => { const n = [...prev]; n[i] = chars; return n; });
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
        <div className="flex max-[414px]:gap-1 gap-2 sm:gap-otp justify-start w-full">
            {/* Hidden input for browser autofill (iOS, Android, password managers) */}
            <input
                ref={autofillInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                onChange={handleAutofill}
                style={{ display: "none" }}
                maxLength={6}
                aria-hidden="true"
            />
            {/* Hidden input for form submission */}
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
    const { auth, url, messagesPerField, message } = kcContext;
    const { msg, msgStr } = i18n;
    const COOLDOWN_KEY = "otp_resend_until";
    const COOLDOWN_SECS = 60;

    const getRemainingCooldown = () => {
        const until = sessionStorage.getItem(COOLDOWN_KEY);
        if (!until) return 0;
        return Math.max(0, Math.ceil((parseInt(until, 10) - Date.now()) / 1000));
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(getRemainingCooldown);
    const formRef = useRef<HTMLFormElement | null>(null);
    const submitButtonRef = useRef<HTMLButtonElement | null>(null);

    // Tick down the cooldown every second
    useEffect(() => {
        if (resendCooldown <= 0) return;

        const timer = setInterval(() => {
            const remaining = getRemainingCooldown();
            setResendCooldown(remaining);
            if (remaining <= 0) clearInterval(timer);
        }, 500);

        return () => clearInterval(timer);
    }, [resendCooldown > 0]);

    const submitWhenComplete = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        formRef.current?.requestSubmit(submitButtonRef.current ?? undefined);
    };

    const handleResend = () => {
        if (resendCooldown > 0 || isSubmitting) {
            return;
        }

        // Persist cooldown end-time so it survives the page reload caused by form submit
        sessionStorage.setItem(COOLDOWN_KEY, String(Date.now() + COOLDOWN_SECS * 1000));
        setResendCooldown(COOLDOWN_SECS);

        // Create a temporary form to submit just the resend action
        const tempForm = document.createElement("form");
        tempForm.method = "post";
        tempForm.action = url.loginAction;

        const resendInput = document.createElement("input");
        resendInput.type = "hidden";
        resendInput.name = "resend";
        resendInput.value = "true";
        tempForm.appendChild(resendInput);

        document.body.appendChild(tempForm);
        tempForm.submit();
        document.body.removeChild(tempForm);
    };

    // The email-OTP authenticator (ext-email-otp) reports a wrong code as a
    // GLOBAL form error (kcContext.message), not under the "totp" field, so we
    // surface both: the global error banner and any field-scoped error.
    const isGlobalError = message?.type === "error";
    const hasError = isGlobalError || messagesPerField.existsError("totp");

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
            displayMessage={isGlobalError}
            displayInfo={false}
        >
            <div className="flex flex-col gap-4">
                <p className="text-sm text-white/80 leading-6">
                    A verification code has been sent to your email. Enter it below to continue.
                </p>

                <form
                    id="kc-otp-login-form"
                    ref={formRef}
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
                            hasError={hasError}
                            onComplete={submitWhenComplete}
                        />
                        {messagesPerField.existsError("totp") && (
                            <p className="text-sm text-destructive">{messagesPerField.getFirstError("totp")}</p>
                        )}
                    </div>

                <div className="flex gap-3 mt-6">
                    <Button
                        type="submit"
                        ref={submitButtonRef}
                        id="kc-submit"
                        name="submit"
                        size="lg"
                        className="flex-1 border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d]"
                        disabled={isSubmitting}
                    >
                        {msgStr("doSubmit")}
                    </Button>
                    <Button
                        type="button"
                        id="kc-resend"
                        size="lg"
                        variant="outline"
                        className="flex-1 border-white/20 bg-white/8 text-white hover:bg-white/14 hover:text-white dark:border-white/20 dark:bg-white/8 dark:text-white dark:hover:bg-white/14"
                        disabled={resendCooldown > 0 || isSubmitting}
                        onClick={handleResend}
                    >
                        {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : msgStr("doResend")}
                    </Button>
                </div>
                </form>
            </div>

            <div className="border-t border-white/20 pt-4 text-center">
                <a
                    href={url.loginRestartFlowUrl}
                    className="text-sm text-white/70 underline underline-offset-4 hover:text-white"
                >
                    Back to sign in
                </a>
            </div>
        </Template>
    );
}
