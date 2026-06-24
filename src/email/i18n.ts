import { GetMessages } from "keycloakify-emails";

export const getMessages: GetMessages = ({ locale }) => {
    const result: Record<string, string> = {};
    if (locale === "en") {
        result["requiredAction.CONFIGURE_TOTP"] = "Configure OTP";
        result["requiredAction.TERMS_AND_CONDITIONS"] = "Terms and Conditions";
        result["requiredAction.UPDATE_PASSWORD"] = "Update Password";
        result["requiredAction.UPDATE_PROFILE"] = "Update Profile";
        result["requiredAction.VERIFY_EMAIL"] = "Verify Email";

        // Phase Two magic-link extension (ext-email-otp authenticator) sends the
        // OTP email via MagicLink.sendOtpEmail(), which resolves its subject from
        // the "otpSubject" message key (default: "Your access code for {0}", where
        // {0} is the realm display name). keycloakify-emails derives otp-email.tsx's
        // subject key as "otpEmailSubject" instead, which the extension never reads,
        // so the subject must be overridden here. Note: this is a Java MessageFormat
        // string, so escape any literal apostrophes by doubling them ('').
        result["otpSubject"] = "Your access code for your Regtransfers account";
    }
    return result;
};
