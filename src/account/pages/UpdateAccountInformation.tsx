import { useMemo, useState } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Template } from "../components/Template";

type UpdateUserProfileKcContext = Extract<KcContext, { pageId: "update-user-profile.ftl" }>;

type Props = {
    kcContext: UpdateUserProfileKcContext;
    i18n: I18n;
};

export default function UpdateAccountInformation({ kcContext, i18n }: Props) {
    const { url, messagesPerField, profile } = kcContext;
    const { msg, msgStr } = i18n;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const mobileFieldCandidates = ["mobileNumber", "phoneNumber", "phone", "mobile"] as const;

    const attributes = useMemo(() => {
        const orderedFieldNames = ["firstName", "lastName", ...mobileFieldCandidates] as const;

        return orderedFieldNames
            .map(fieldName => profile.attributesByName[fieldName])
            .filter((attribute): attribute is NonNullable<typeof attribute> => attribute !== undefined && !attribute.readOnly);
    }, [profile.attributesByName]);

    const getLabel = (attributeName: string, fallback?: string) => {
        switch (attributeName) {
            case "firstName":
                return msg("firstName");
            case "lastName":
                return msg("lastName");
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
            headerNode={<p className="kc-display-heading font-bold font-[Roboto]">Update Account Information</p>}
            displayMessage={false}
        >
            <form
                id="kc-update-profile-form"
                action={url.accountUrl}
                method="post"
                onSubmit={() => setIsSubmitting(true)}
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
                            <Label htmlFor={attribute.name} className="text-white font-medium">
                                {getLabel(attribute.name, attribute.displayName)}
                                {isRequired && <span className="text-destructive">*</span>}
                            </Label>
                            <Input
                                id={attribute.name}
                                name={attribute.name}
                                type={
                                    attribute.name === "email"
                                        ? "email"
                                        : isMobileField
                                          ? "tel"
                                          : "text"
                                }
                                defaultValue={value}
                                autoComplete={
                                    attribute.autocomplete ??
                                    (isMobileField
                                        ? "tel"
                                        : attribute.name === "firstName"
                                          ? "given-name"
                                          : attribute.name === "lastName"
                                            ? "family-name"
                                            : undefined)
                                }
                                required={isRequired}
                                aria-invalid={isInvalid}
                                maxLength={maxLength === undefined ? undefined : Number(maxLength)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                            />
                            {isInvalid && (
                                <p className="text-sm text-destructive">
                                    {messagesPerField?.get?.(attribute.name)}
                                </p>
                            )}
                        </div>
                    );
                })}

                {/* Message Alert */}
                {kcContext.message !== undefined && (
                    <Alert
                        variant={
                            kcContext.message.type === "error" ? "inline" : "default"
                        }
                    >
                        <AlertDescription
                            dangerouslySetInnerHTML={{ __html: kcContext.message.summary }}
                        />
                    </Alert>
                )}

                {/* Submit Button */}
                <div className="mt-3 mb-4">
                    <Button
                        type="submit"
                        id="kc-submit"
                        name="submitAction"
                        value="Save"
                        size="lg"
                        disabled={isSubmitting}
                        className="w-full border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d]"
                    >
                        {msgStr("doSave")}
                    </Button>
                </div>
            </form>
        </Template>
    );
}
