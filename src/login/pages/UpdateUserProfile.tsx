import { useState } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Template } from "../components/Template";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type UpdateUserProfileKcContext = Extract<KcContext, { pageId: "login-update-profile.ftl" }>;

type Props = {
    kcContext: UpdateUserProfileKcContext;
    i18n: I18n;
};

const getAttributeValue = (
    attribute: { value?: string; values?: string[] } | undefined
) => attribute?.value ?? attribute?.values?.[0] ?? "";

export default function UpdateUserProfile({ kcContext, i18n }: Props) {
    const { url, profile, messagesPerField, message } = kcContext;
    const { msg } = i18n;

    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

    const firstNameError = messagesPerField.existsError("firstName");
    const lastNameError = messagesPerField.existsError("lastName");
    const mobileError = messagesPerField.existsError("mobileNumber");
    const hasVisibleFieldErrors = messagesPerField.existsError("firstName", "lastName", "mobileNumber");

    const [marketingConsent, setMarketingConsent] = useState(
        getAttributeValue(profile.attributesByName["marketingConsent"]) === "true"
    );

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={
                <>
                    <p className="kc-display-heading font-bold font-[Roboto]">Update your details</p>
                    <h1 className="text-[0.9375rem] font-normal text-white/80 mt-1 font-[Arimo]">
                        Please confirm or complete the fields below to continue
                    </h1>
                </>
            }
            displayMessage={message !== undefined && !hasVisibleFieldErrors}
            displayInfo={false}
        >
            <form
                action={url.loginAction}
                method="post"
                onSubmit={() => setIsSubmitDisabled(true)}
                className="flex flex-col gap-4"
            >
                {/* First name */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="firstName">{msg("firstName")} <span className="text-destructive">*</span></Label>
                    <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        inputSize="lg"
                        autoComplete="given-name"
                        defaultValue={getAttributeValue(profile.attributesByName["firstName"])}
                        required
                        aria-invalid={firstNameError}
                    />
                    {firstNameError && (
                        <p className="text-sm text-destructive">
                            {messagesPerField.getFirstError("firstName")}
                        </p>
                    )}
                </div>

                {/* Last name */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="lastName">{msg("lastName")} <span className="text-destructive">*</span></Label>
                    <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        inputSize="lg"
                        autoComplete="family-name"
                        defaultValue={getAttributeValue(profile.attributesByName["lastName"])}
                        required
                        aria-invalid={lastNameError}
                    />
                    {lastNameError && (
                        <p className="text-sm text-destructive">
                            {messagesPerField.getFirstError("lastName")}
                        </p>
                    )}
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
                        defaultValue={getAttributeValue(profile.attributesByName["mobileNumber"])}
                        required
                        aria-invalid={mobileError}
                    />
                    {mobileError && (
                        <p className="text-sm text-destructive">
                            {messagesPerField.getFirstError("mobileNumber")}
                        </p>
                    )}
                </div>

                {/* Marketing consent */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-3 py-3">
                        {/*
                          With the declarative user profile enabled (Keycloak 26), the update-profile
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
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="w-full mt-3 mb-4 border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d]"
                    disabled={isSubmitDisabled}
                    id="kc-submit"
                >
                    Submit
                </Button>
            </form>
        </Template>
    );
}
