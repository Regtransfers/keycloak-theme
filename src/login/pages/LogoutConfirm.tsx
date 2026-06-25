import { Button } from "@/components/ui/button";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Template } from "../components/Template";

type LogoutConfirmKcContext = Extract<KcContext, { pageId: "logout-confirm.ftl" }>;

type Props = {
    kcContext: LogoutConfirmKcContext;
    i18n: I18n;
};

export default function LogoutConfirm({ kcContext, i18n }: Props) {
    const { url, logoutConfirm } = kcContext;
    const { msg } = i18n;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            headerNode={<p className="kc-display-heading font-bold font-[Roboto]">{msg("logoutConfirmTitle")}</p>}
            displayMessage={false}
            displayInfo={false}
        >
            <div className="flex flex-col gap-4">
                <p className="text-sm text-white/80 leading-6">{msg("logoutConfirmHeader")}</p>

                <form action={url.logoutConfirmAction} method="post" className="mt-2">
                    <input type="hidden" name="session_code" value={logoutConfirm.code} />
                    <Button
                        type="submit"
                        name="confirmLogout"
                        id="kc-logout"
                        size="lg"
                        className="w-full border border-[#1b9a38] hover:bg-[#00692f] hover:border-[#007f1d]"
                    >
                        Log out
                    </Button>
                </form>
            </div>
        </Template>
    );
}