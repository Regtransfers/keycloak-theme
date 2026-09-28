import { renderToStaticMarkup } from "react-dom/server";
import { ReactElement } from "react";
import { render } from "jsx-email";

export function buildEmailHtml(element: ReactElement): string {
    return "<!DOCTYPE html>" + renderToStaticMarkup(element);
}


// Plain-text render for what Keycloak actually sends. Same as jsx-email's
// defaults (its `selectors` option replaces them wholesale, so they're repeated
// here), plus: phone links print just their number, not "number tel:number".
export function buildEmailPlainText(element: ReactElement): Promise<string> {
    return render(element, {
        plainText: {
            selectors: [
                { format: "skip", selector: "img" },
                { format: "skip", selector: '[data-skip="true"]' },
                { options: { linkBrackets: false }, selector: "a" },
                { format: "anchor", options: { ignoreHref: true }, selector: 'a[href^="tel:"]' },
                { format: "raw", options: {}, selector: "jsx-email-raw" }
            ]
        }
    });
}
