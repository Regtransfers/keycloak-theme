import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Template } from "../components/Template";
import { ProviderIcon } from "../components/ProviderIcon";

type RegisterKcContext = Extract<KcContext, { pageId: "register.ftl" }>;

type Props = {
    kcContext: RegisterKcContext;
    i18n: I18n;
    googleLoginUrl?: string;
};

export default function RegisterChoice({ kcContext, i18n, googleLoginUrl = "#" }: Props) {
    const { url } = kcContext;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={
                <>
                    <p className="text-2xl font-bold">Join Regtransfers</p>
                    <h1 className="text-sm font-normal text-white/80 mt-1">Create an account with one of the easy options below</h1>
                </>
            }
            displayMessage={false}
            displayInfo={false}
        >
            <div className="flex flex-col gap-3">
                {/* Sign up with Email */}
                <a
                    href={url.registrationAction}
                    className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "w-full text-foreground dark:text-foreground gap-2"
                    )}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    Sign up with Email
                </a>

                {/* Sign up with Google */}
                <a
                    href={googleLoginUrl}
                    className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "w-full text-foreground dark:text-foreground gap-2"
                    )}
                >
                    <ProviderIcon providerId="google" />
                    Continue with Google
                </a>
            </div>
        </Template>
    );
}
