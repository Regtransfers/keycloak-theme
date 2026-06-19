import { useState } from "react";
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
    const { url, messagesPerField } = kcContext;
    const { msg, msgStr } = i18n;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const firstNameError = messagesPerField?.existsError?.("firstName");
    const lastNameError = messagesPerField?.existsError?.("lastName");

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
                {/* First Name */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="firstName" className="text-white font-medium">
                        {msg("firstName")}
                        <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        autoComplete="given-name"
                        aria-invalid={firstNameError}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                    {firstNameError && (
                        <p className="text-sm text-destructive">
                            {messagesPerField?.get?.("firstName")}
                        </p>
                    )}
                </div>

                {/* Last Name */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="lastName" className="text-white font-medium">
                        {msg("lastName")}
                        <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        autoComplete="family-name"
                        aria-invalid={lastNameError}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                    {lastNameError && (
                        <p className="text-sm text-destructive">
                            {messagesPerField?.get?.("lastName")}
                        </p>
                    )}
                </div>

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
                <div className="pt-2">
                    <Button
                        type="submit"
                        id="kc-submit"
                        name="submitAction"
                        value="Save"
                        size="lg"
                        disabled={isSubmitting}
                        className="w-full border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d] bg-green-600"
                    >
                        {msgStr("doSave")}
                    </Button>
                </div>
            </form>
        </Template>
    );
}
