import { useState } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Template } from "../components/Template";

type RegisterKcContext = Extract<KcContext, { pageId: "register.ftl" }>;

type Props = {
    kcContext: RegisterKcContext;
    i18n: I18n;
};

export default function Register({ kcContext, i18n }: Props) {
    const { url, messagesPerField, recaptchaRequired, recaptchaSiteKey } = kcContext;
    const { msg, msgStr } = i18n;

    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
    const [marketingConsent, setMarketingConsent] = useState(false);

    const firstNameError = messagesPerField.existsError("firstName");
    const lastNameError = messagesPerField.existsError("lastName");
    const emailError = messagesPerField.existsError("email");
    const hasVisibleFieldErrors = messagesPerField.existsError("firstName", "lastName", "email", "mobileNumber");

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={
                <>
                    <p className="kc-display-heading font-bold font-[Roboto]">Join Regtransfers</p>
                    <h1 className="text-[0.9375rem] font-normal text-white/80 mt-1 font-[Arimo]">Create an account by filling in the fields below</h1>
                </>
            }
            displayMessage={!hasVisibleFieldErrors}
            displayInfo={false}
        >
            <form
                action={url.registrationAction}
                method="post"
                onSubmit={() => setIsSubmitDisabled(true)}
                className="flex flex-col gap-4"
            >
                {/* First name, Middle initial & Last name */}
                <div className="grid grid-cols-1 gap-3">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="firstName">{msg("firstName")} <span className="text-destructive">*</span></Label>
                        <Input
                            id="firstName"
                            name="firstName"
                            type="text"
                            inputSize="lg"
                            autoComplete="given-name"
                            autoFocus
                            required
                            aria-invalid={firstNameError}
                        />
                        {firstNameError && (
                            <p className="text-sm text-destructive">
                                {messagesPerField.getFirstError("firstName")}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="middleName">Middle initial</Label>
                        <Input
                            id="middleName"
                            name="middleName"
                            type="text"
                            inputSize="lg"
                            autoComplete="additional-name"
                            maxLength={1}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="lastName">{msg("lastName")} <span className="text-destructive">*</span></Label>
                        <Input
                            id="lastName"
                            name="lastName"
                            type="text"
                            inputSize="lg"
                            autoComplete="family-name"
                            required
                            aria-invalid={lastNameError}
                        />
                        {lastNameError && (
                            <p className="text-sm text-destructive">
                                {messagesPerField.getFirstError("lastName")}
                            </p>
                        )}
                    </div>
                </div>

                {/* Mobile number */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="mobileNumber">Mobile number <span className="text-destructive">*</span></Label>
                    <Input
                        id="mobileNumber"
                        name="mobileNumber"
                        type="tel"
                        inputSize="lg"
                        autoComplete="tel"
                        required
                    />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="email">{msg("email")} <span className="text-destructive">*</span></Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        inputSize="lg"
                        autoComplete="email"
                        aria-invalid={emailError}
                    />
                    {emailError && (
                        <p className="text-sm text-destructive">
                            {messagesPerField.getFirstError("email")}
                        </p>
                    )}
                </div>

                {/* Recaptcha */}
                {recaptchaRequired && (
                    <div className="g-recaptcha" data-size="compact" data-sitekey={recaptchaSiteKey} />
                )}

                {/* Marketing consent */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-3 py-3">
                        {/*
                          With the declarative user profile enabled (Keycloak 26), the registration
                          form posts user-profile attributes under their plain attribute name -
                          NOT prefixed with "user.attributes." and with no "[]". The name must match
                          the attribute name declared in the realm User Profile config ("marketingConsent").
                          When unchecked nothing is posted, so the attribute's defaultValue ("false") applies.
                        */}
                        <input
                            type="checkbox"
                            id="marketingConsent"
                            name="marketingConsent"
                            value="true"
                            checked={marketingConsent}
                            onChange={(e) => setMarketingConsent(e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-primary"
                        />
                        <Label htmlFor="marketingConsent" className="font-normal cursor-pointer leading-snug">
                            Please send me special offers, discounts and number plates that may be relevant to me. I understand I can unsubscribe at any time.
                        </Label>
                    </div>
                    <p className="text-sm">
                        <a
                            href="https://www.regtransfers.review/company/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/70 underline underline-offset-4 hover:text-white"
                        >
                            Privacy policy
                        </a>
                    </p>
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="w-full mt-3 mb-0 border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d]"
                    disabled={isSubmitDisabled}
                    id="kc-register"
                >
                    {msgStr("doRegister")}
                </Button>

                <div className="border-t border-white/20 pt-4">
                    <p className="text-center text-sm text-white/70">
                        Already with Regtransfers?{" "}
                        <a href={url.loginUrl} className="underline underline-offset-4 text-white">
                            {msg("doLogIn")}
                        </a>
                    </p>
                </div>
            </form>
        </Template>
    );
}
