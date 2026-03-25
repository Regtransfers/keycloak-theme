import { useState } from "react";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

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

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{msg("loginTitle", realm.displayName)}</CardTitle>
                    {realm.displayNameHtml && (
                        <CardDescription
                            dangerouslySetInnerHTML={{ __html: realm.displayNameHtml }}
                        />
                    )}
                </CardHeader>
                <CardContent>
                    <form
                        action={url.loginAction}
                        method="post"
                        onSubmit={() => setIsLoginButtonDisabled(true)}
                    >
                        <div className="flex flex-col gap-4">
                            {/* Username / Email */}
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
                                    autoComplete="username"
                                    defaultValue={login.username ?? ""}
                                    autoFocus={!login.username}
                                    aria-invalid={usernameError}
                                />
                                {usernameError && (
                                    <p className="text-sm text-destructive">
                                        {messagesPerField.get("username")}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">{msg("password")}</Label>
                                    {realm.resetPasswordAllowed && (
                                        <a
                                            href={url.loginResetCredentialsUrl}
                                            className="text-sm text-primary underline-offset-4 hover:underline"
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
                                        {messagesPerField.get("password")}
                                    </p>
                                )}
                            </div>

                            {/* Remember me */}
                            {realm.rememberMe && (
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

                            <input type="hidden" name="credentialId" value={kcContext.selectedCredential ?? ""} />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoginButtonDisabled}
                                name="login"
                            >
                                {msgStr("doLogIn")}
                            </Button>

                            {/* Social / identity providers */}
                            {social?.providers && social.providers.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                                        <span className="relative z-10 bg-card px-2 text-muted-foreground">
                                            {msg("identity-provider-login-label")}
                                        </span>
                                    </div>
                                    {social.providers.map(p => (
                                        <Button key={p.providerId} variant="outline" className="w-full" asChild>
                                            <a href={p.loginUrl}>{p.displayName}</a>
                                        </Button>
                                    ))}
                                </div>
                            )}

                            {/* Registration link */}
                            {realm.registrationAllowed && (
                                <p className="text-center text-sm text-muted-foreground">
                                    {msg("noAccount")}{" "}
                                    <a
                                        href={url.registrationUrl}
                                        className="text-primary underline-offset-4 hover:underline"
                                    >
                                        {msg("doRegister")}
                                    </a>
                                </p>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
