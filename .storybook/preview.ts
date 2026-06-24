import type { Preview } from "@storybook/react";
import { useEffect } from "react";
import "../src/login/main.css";

const preview: Preview = {
    globalTypes: {
        colorMode: {
            name: "Color mode",
            description: "Light / dark mode",
            defaultValue: "light",
            toolbar: {
                icon: "circlehollow",
                items: [
                    { value: "light", icon: "sun", title: "Light" },
                    { value: "dark", icon: "moon", title: "Dark" },
                ],
                showName: true,
            },
        },
    },
    decorators: [
        (Story, context) => {
            const mode = context.globals.colorMode as string;
            useEffect(() => {
                const html = document.documentElement;
                if (mode === "dark") {
                    html.classList.add("dark");
                    document.body.classList.add("dark", "theme-dark");
                } else {
                    html.classList.remove("dark");
                    document.body.classList.remove("dark", "theme-dark");
                }
            }, [mode]);
            return Story();
        },
    ],
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i
            }
        }
    }
};

export default preview;
