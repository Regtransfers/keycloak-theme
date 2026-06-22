import { useState } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Template } from "../components/Template";

type LoginUpdatePasswordKcContext = Extract<KcContext, { pageId: "login-update-password.ftl" }>;

type Props = {
    kcContext: LoginUpdatePasswordKcContext;
    i18n: I18n;
};

export default function LoginUpdatePassword({ kcContext, i18n }: Props) {
    const { url, messagesPerField } = kcContext;
    const { msgStr } = i18n;

    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={
                <>
                    <p className="kc-display-heading font-bold font-[Roboto]">Set a new password</p>
                    <h1 className="text-[0.9375rem] font-normal text-white/80 mt-1 font-[Arimo]">
                        Choose a new password for your account
                    </h1>
                </>
            }
            displayMessage={false}
            displayInfo={false}
        >
            <form
                action={url.loginAction}
                method="post"
                onSubmit={() => setIsSubmitDisabled(true)}
                className="flex flex-col gap-4"
            >
                <Button
                    type="submit"
                    size="lg"
                    className="w-full border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d]"
                    disabled={isSubmitDisabled}
                >
                    Continue
                </Button>
            </form>
        </Template>
    );
}
