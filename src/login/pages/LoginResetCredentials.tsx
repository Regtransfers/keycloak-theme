import { useState } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Template } from "../components/Template";

type LoginResetCredentialsKcContext = Extract<KcContext, { pageId: "login-reset-password.ftl" }>;

type Props = {
    kcContext: LoginResetCredentialsKcContext;
    i18n: I18n;
};

export default function LoginResetCredentials({ kcContext, i18n }: Props) {
    const { url, messagesPerField } = kcContext;
    const { msgStr } = i18n;

    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

    const emailError = messagesPerField.existsError("username");

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={
                <>
                    <p className="kc-display-heading font-bold font-[Roboto]">Reset your password</p>
                    <h1 className="text-[0.9375rem] font-normal text-white/80 mt-1 font-[Arimo]">
                        Enter your email address and we'll send you an email to reset your password
                    </h1>
                </>
            }
            displayMessage={!messagesPerField.existsError("username")}
            displayInfo={false}
        >
            <form
                action={url.loginAction}
                method="post"
                onSubmit={() => setIsSubmitDisabled(true)}
                className="flex flex-col gap-4"
            >
                <div className="flex flex-col gap-2">
                    <Label htmlFor="username">{msgStr("email")} <span className="text-destructive">*</span></Label>
                    <Input
                        id="username"
                        name="username"
                        type="email"
                        inputSize="lg"
                        autoComplete="email"
                        autoFocus
                        required
                        aria-invalid={emailError}
                    />
                    {emailError && (
                        <p className="text-sm text-destructive">
                            {messagesPerField.getFirstError("username")}
                        </p>
                    )}
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="w-full border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d]"
                    disabled={isSubmitDisabled}
                >
                    Continue
                </Button>

                <p className="text-center text-sm text-white/70">
                    <a href={url.loginUrl} className="underline underline-offset-4 text-white">
                        Back to sign in
                    </a>
                </p>
            </form>
        </Template>
    );
}
