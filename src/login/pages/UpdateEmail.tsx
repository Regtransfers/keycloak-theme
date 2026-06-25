import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Template } from "../components/Template";

type UpdateEmailKcContext = Extract<KcContext, { pageId: "update-email.ftl" }>;

type Props = {
    kcContext: UpdateEmailKcContext;
    i18n: I18n;
};

const getAttributeValue = (
    attribute: { value?: string; values?: string[] } | undefined
) => attribute?.value ?? attribute?.values?.[0] ?? "";

export default function UpdateEmail({ kcContext, i18n }: Props) {
    const { url, profile, messagesPerField, message } = kcContext;
    const { msg } = i18n;

    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
    const [logoutOtherSessions, setLogoutOtherSessions] = useState(true);

    const emailError = messagesPerField.existsError("email");

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={
                <>
                    <p className="kc-display-heading font-bold font-[Roboto]">Update your email</p>
                    <h1 className="text-[0.9375rem] font-normal text-white/80 mt-1 font-[Arimo]">
                        Confirm your new email address to continue
                    </h1>
                </>
            }
            displayMessage={message !== undefined && !emailError}
            displayInfo={false}
        >
            <form
                id="kc-update-email-form"
                action={url.loginAction}
                method="post"
                onSubmit={() => setIsSubmitDisabled(true)}
                className="flex flex-col gap-4"
            >
                <div className="flex flex-col gap-2">
                    <Label htmlFor="email">{msg("email")} <span className="text-destructive">*</span></Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        inputSize="lg"
                        autoComplete="email"
                        defaultValue={getAttributeValue(profile.attributesByName["email"])}
                        required
                        aria-invalid={emailError}
                    />
                    {emailError && (
                        <p className="text-sm text-destructive">
                            {messagesPerField.getFirstError("email")}
                        </p>
                    )}
                </div>

                <div className="flex items-start gap-3 py-1">
                    <input
                        type="checkbox"
                        id="logout-sessions"
                        name="logout-sessions"
                        value="on"
                        checked={logoutOtherSessions}
                        onChange={(event) => setLogoutOtherSessions(event.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-primary"
                    />
                    <Label htmlFor="logout-sessions" className="font-normal cursor-pointer leading-snug">
                        {msg("logoutOtherSessions")}
                    </Label>
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="w-full mt-3 mb-1 border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d]"
                    disabled={isSubmitDisabled}
                    id="kc-submit"
                >
                    {msg("doSubmit")}
                </Button>

                {kcContext.isAppInitiatedAction && (
                    <Button
                        type="submit"
                        name="cancel-aia"
                        value="true"
                        variant="outline"
                        size="lg"
                        className="w-full mb-3 border-white/30 text-white hover:bg-white/10"
                    >
                        {msg("doCancel")}
                    </Button>
                )}
            </form>
        </Template>
    );
}