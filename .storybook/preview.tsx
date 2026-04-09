import type { Preview } from "@storybook/react";
import React, { useEffect } from "react";

const DARK_BG = "#09090b";

const preview: Preview = {
    decorators: [
        (Story, context) => {
            const isDark = context.globals.backgrounds?.value === DARK_BG;
            useEffect(() => {
                const html = document.documentElement;
                if (isDark) {
                    html.classList.add("dark");
                    document.body.classList.add("dark", "theme-dark");
                } else {
                    html.classList.remove("dark");
                    document.body.classList.remove("dark", "theme-dark");
                }
            }, [isDark]);
            return Story();
        },
    ],
    parameters: {
        backgrounds: {
            options: {
                light: { name: "Light", value: "#ffffff" },
                dark: { name: "Dark", value: DARK_BG },
            },
            default: "light",
        },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
};

export default preview;
