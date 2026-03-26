import { useState } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Template } from "../components/Template";
import { ProviderIcon } from "../components/ProviderIcon";

type LoginKcContext = Extract<KcContext, { pageId: "login.ftl" }>;

type Props = {
    kcContext: LoginKcContext;
    i18n: I18n;
};

export default function Login({ kcContext, i18n }: Props) {
    const { realm, url, login, messagesPerField, social } = kcContext;
    const { msg, msgStr } = i18n;

    const [isLoginButtonDisabled, setIsLoginButtonDisabled] = useState(false);

    const usernameError = messagesPerField.existsError("username", "password");
    const passwordError = messagesPerField.existsError("password");

    const socialProvidersNode =
        realm.password && social?.providers && social.providers.length > 0 ? (
            <div className="flex flex-col gap-3">
                <div className="relative text-center text-xs">
                    <span className="relative z-10 bg-card px-2 text-muted-foreground">
                        {msg("identity-provider-login-label")}
                    </span>
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                    </div>
                </div>
                {social.providers.map(p => (
                    <a
                        key={p.providerId}
                        href={p.loginUrl}
                        className={cn(
                            buttonVariants({ variant: "outline", size: "lg" }),
                            "w-full text-foreground dark:text-foreground gap-2"
                        )}
                    >
                        <ProviderIcon providerId={p.providerId} />
                        {p.displayName}
                    </a>
                ))}
            </div>
        ) : null;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={msg("loginAccountTitle")}
            displayMessage={!messagesPerField.existsError("username", "password")}
            displayInfo={realm.password && realm.registrationAllowed && !kcContext.registrationDisabled}
            infoNode={
                <span>
                    {msg("noAccount")}{" "}
                    <a href={url.registrationUrl} className="underline underline-offset-4">
                        {msg("doRegister")}
                    </a>
                </span>
            }
            socialProvidersNode={socialProvidersNode}
        >
            {realm.password && (
                <form
                    action={url.loginAction}
                    method="post"
                    onSubmit={() => setIsLoginButtonDisabled(true)}
                    className="flex flex-col gap-4"
                >
                    {/* Username / Email */}
                    {!kcContext.usernameHidden && (
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="username">
                                {!realm.loginWithEmailAllowed
                                    ? msg("username")
                                    : !realm.registrationEmailAsUsername
                                      ? msg("usernameOrEmail")
                                      : msg("email")}
                            </Label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete={kcContext.enableWebAuthnConditionalUI ? "username webauthn" : "username"}
                                defaultValue={login.username ?? ""}
                                autoFocus={!login.username}
                                aria-invalid={usernameError}
                            />
                            {usernameError && (
                                <p className="text-sm text-destructive">
                                    {messagesPerField.getFirstError("username", "password")}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Password */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">{msg("password")}</Label>
                            {realm.resetPasswordAllowed && (
                                <a
                                    href={url.loginResetCredentialsUrl}
                                    className="text-sm underline underline-offset-4"
                                >
                                    {msg("doForgotPassword")}
                                </a>
                            )}
                        </div>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            autoFocus={!!login.username}
                            aria-invalid={passwordError}
                        />
                        {passwordError && (
                            <p className="text-sm text-destructive">
                                {messagesPerField.getFirstError("username", "password")}
                            </p>
                        )}
                    </div>

                    {/* Remember me */}
                    {realm.rememberMe && !kcContext.usernameHidden && (
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="rememberMe"
                                name="rememberMe"
                                defaultChecked={!!login.rememberMe}
                            />
                            <Label htmlFor="rememberMe" className="font-normal cursor-pointer">
                                {msg("rememberMe")}
                            </Label>
                        </div>
                    )}

                    <input
                        type="hidden"
                        id="id-hidden-input"
                        name="credentialId"
                        value={kcContext.auth?.selectedCredential ?? ""}
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoginButtonDisabled}
                        name="login"
                        id="kc-login"
                    >
                        {msgStr("doLogIn")}
                    </Button>
                </form>
            )}

            {/* Passkey sign-in */}
            {kcContext.enableWebAuthnConditionalUI && (
                <>
                    <div className="relative text-center text-xs">
                        <span className="relative z-10 bg-card px-2 text-muted-foreground">
                            {msg("or")}
                        </span>
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                    </div>
                    <form id="webauth" action={url.loginAction} method="post">
                        <input type="hidden" name="authenticationExecution" />
                        <Button
                            type="submit"
                            variant="outline"
                            className="w-full"
                            id="authenticateWebAuthnButton"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                                <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2z" />
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                <line x1="12" y1="15" x2="12" y2="19" />
                                <line x1="10" y1="17" x2="14" y2="17" />
                            </svg>
                            {msgStr("passkey-signin-with-passkey-label")}
                        </Button>
                    </form>
                </>
            )}
        </Template>
    );
}
