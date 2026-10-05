import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { KcPage } from "./kc.gen";

// The following block can be uncommented to test a specific page with `npm run dev`
// Don't forget to comment back or your bundle size will increase
/*
import { getKcContextMock } from "./login/KcPageStory";

if (import.meta.env.DEV) {
    window.kcContext = getKcContextMock({
        pageId: "register.ftl",
        overrides: {}
    });
}
*/

// src/loader/assetRetry.js reads this flag to know the page has started. It is also what stops a
// second copy of this file, should one ever be loaded, from rendering a second time.
if (!window.__rtThemeBooted) {
    window.__rtThemeBooted = true;

    // Present only when the loader's notice was put somewhere other than #root.
    document.querySelector("[data-rt-asset-notice]")?.remove();

    createRoot(document.getElementById("root")!).render(
        <StrictMode>
            {!window.kcContext ? (
                <h1>No Keycloak Context</h1>
            ) : (
                <KcPage kcContext={window.kcContext} />
            )}
        </StrictMode>
    );
}
