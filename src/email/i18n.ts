import { GetMessages } from "keycloakify-emails";

export const getMessages: GetMessages = ({ locale }) => {
    const result: Record<string, string> = {};
    if (locale === "en") {
        result["requiredAction.CONFIGURE_TOTP"] = "Configure OTP";
        result["requiredAction.TERMS_AND_CONDITIONS"] = "Terms and Conditions";
        result["requiredAction.UPDATE_PASSWORD"] = "Update Password";
        result["requiredAction.UPDATE_PROFILE"] = "Update Profile";
        result["requiredAction.VERIFY_EMAIL"] = "Verify Email";
    }
    return result;
};
