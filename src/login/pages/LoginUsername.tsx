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

type LoginUsernameKcContext = Extract<KcContext, { pageId: "login-username.ftl" }>;

type Props = {
    kcContext: LoginUsernameKcContext;
    i18n: I18n;
};

export default function LoginUsername({ kcContext, i18n }: Props) {
    const { realm, url, login, messagesPerField, social, auth } = kcContext;
    const { msg, msgStr } = i18n;

    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

    const usernameError = messagesPerField.existsError("username");

    const socialProvidersNode =
        social?.providers && social.providers.length > 0 ? (
            <div className="flex flex-col gap-3">
                <div className="relative text-center text-xs">
                    <hr className="pt-2" />
                    <span>{msg("identity-provider-login-label")}</span>
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
            headerNode={
                <>
                    <p className="kc-display-heading font-bold font-[Roboto]">Welcome</p>
                    <h1 className="text-[0.9375rem] font-normal text-white/80 mt-1 font-[Arimo]">
                        Sign in with your email
                    </h1>
                </>
            }
            displayMessage={!usernameError}
            displayInfo={realm.registrationAllowed && !kcContext.registrationDisabled}
            infoNode={
                <span>
                    No account?{" "}
                    <a href={url.registrationUrl} className="underline underline-offset-4">
                        Create one
                    </a>
                </span>
            }
            socialProvidersNode={socialProvidersNode}
        >
            <form
                id="kc-form-login"
                action={url.loginAction}
                method="post"
                onSubmit={() => setIsSubmitDisabled(true)}
                className="flex flex-col gap-4"
            >
                <div className="flex flex-col gap-2">
                    <Label htmlFor="username">{msg("email")}</Label>
                    <Input
                        id="username"
                        name="username"
                        type="text"
                        inputSize="lg"
                        autoComplete="username"
                        defaultValue={login.username ?? ""}
                        autoFocus
                        aria-invalid={usernameError}
                    />
                    {usernameError && (
                        <p className="text-sm text-destructive">
                            {messagesPerField.getFirstError("username")}
                        </p>
                    )}
                </div>

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

                <Button
                    type="submit"
                    size="lg"
                    className="w-full border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d]"
                    disabled={isSubmitDisabled}
                    name="login"
                    id="kc-login"
                >
                    {msgStr("doLogIn")}
                </Button>
            </form>

            {auth?.showTryAnotherWayLink && (
                <form id="kc-select-try-another-way-form" action={url.loginAction} method="post">
                    <input type="hidden" name="tryAnotherWay" value="on" />
                    <a href="#" id="try-another-way" onClick={e => { e.preventDefault(); (e.currentTarget.closest("form") as HTMLFormElement)?.submit(); }}>
                        {msg("doTryAnotherWay")}
                    </a>
                </form>
            )}
        </Template>
    );
}
