import { useMemo, useState } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Template } from "../components/Template";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type IdpReviewUserProfileKcContext = Extract<KcContext, { pageId: "idp-review-user-profile.ftl" }>;

type Props = {
    kcContext: IdpReviewUserProfileKcContext;
    i18n: I18n;
};

export default function IdpReviewUserProfile({ kcContext, i18n }: Props) {
    const { url, profile, messagesPerField, message } = kcContext;
    const { msg } = i18n;

    const mobileFieldCandidates = ["mobileNumber", "phoneNumber", "phone", "mobile"] as const;

    const providerName =
        (kcContext as { idpAlias?: string }).idpAlias ??
        (kcContext as { brokerContext?: { idpAlias?: string } }).brokerContext?.idpAlias ??
        "Google";

    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

    const attributes = useMemo(() => {
        const orderedFieldNames = ["email", "firstName", "lastName", ...mobileFieldCandidates] as const;

        return orderedFieldNames
            .map(fieldName => profile.attributesByName[fieldName])
            .filter((attribute): attribute is NonNullable<typeof attribute> => attribute !== undefined && !attribute.readOnly);
    }, [profile.attributesByName]);

    const mobileAttributeName = attributes.find(attribute =>
        mobileFieldCandidates.includes(attribute.name as (typeof mobileFieldCandidates)[number])
    )?.name;

    const showFallbackMobileField = mobileAttributeName === undefined;

    const getLabel = (attributeName: string, fallback?: string) => {
        switch (attributeName) {
            case "firstName":
                return msg("firstName");
            case "lastName":
                return msg("lastName");
            case "email":
                return msg("email");
            case "mobileNumber":
            case "phoneNumber":
            case "phone":
            case "mobile":
                return "Mobile number";
            default:
                return fallback ?? attributeName;
        }
    };

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={
                <>
                    <p className="kc-display-heading font-bold font-[Roboto]">Finish joining with {providerName}</p>
                    <h1 className="text-[0.9375rem] font-normal text-white/80 mt-1 font-[Arimo]">
                        Just one more detail and your {providerName} sign-up will be complete
                    </h1>
                </>
            }
            displayMessage={message !== undefined}
            displayInfo={false}
        >
            <form
                action={url.loginAction}
                method="post"
                onSubmit={() => setIsSubmitDisabled(true)}
                className="flex flex-col gap-4"
            >
                {attributes.map(attribute => {
                    const value = attribute.value ?? attribute.values?.[0] ?? "";
                    const isInvalid = messagesPerField.existsError(attribute.name);
                    const isMobileField = mobileFieldCandidates.includes(attribute.name as (typeof mobileFieldCandidates)[number]);
                    const isRequired = attribute.required || isMobileField;
                    const maxLength =
                        attribute.annotations.inputTypeMaxlength ??
                        attribute.validators.length?.max;

                    return (
                        <div key={attribute.name} className="flex flex-col gap-2">
                            <Label htmlFor={attribute.name}>
                                {getLabel(attribute.name, attribute.displayName)}
                                {isRequired && <span className="text-destructive"> *</span>}
                            </Label>
                            <Input
                                id={attribute.name}
                                name={attribute.name}
                                type={
                                    attribute.name === "email"
                                        ? "email"
                                        : mobileFieldCandidates.includes(attribute.name as (typeof mobileFieldCandidates)[number])
                                          ? "tel"
                                          : "text"
                                }
                                inputSize="lg"
                                defaultValue={value}
                                autoComplete={
                                    attribute.autocomplete ??
                                    (mobileFieldCandidates.includes(attribute.name as (typeof mobileFieldCandidates)[number])
                                        ? "tel"
                                        : undefined)
                                }
                                required={isRequired}
                                aria-invalid={isInvalid}
                                maxLength={maxLength === undefined ? undefined : Number(maxLength)}
                            />
                            {isInvalid && (
                                <p className="text-sm text-destructive">
                                    {messagesPerField.getFirstError(attribute.name)}
                                </p>
                            )}
                        </div>
                    );
                })}

                {showFallbackMobileField && (
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="mobileNumber">
                            Mobile number
                            <span className="text-destructive"> *</span>
                        </Label>
                        <Input
                            id="mobileNumber"
                            name="mobileNumber"
                            type="tel"
                            inputSize="lg"
                            autoComplete="tel"
                            required
                            aria-invalid={messagesPerField.existsError("mobileNumber")}
                        />
                        {messagesPerField.existsError("mobileNumber") && (
                            <p className="text-sm text-destructive">
                                {messagesPerField.getFirstError("mobileNumber")}
                            </p>
                        )}
                    </div>
                )}

                <Button
                    type="submit"
                    size="lg"
                    className="w-full mt-2 border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d]"
                    disabled={isSubmitDisabled}
                    id="kc-submit"
                >
                    Submit
                </Button>
            </form>
        </Template>
    );
}