import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "logout-confirm.ftl" });

const meta = {
    title: "login/logout-confirm.ftl",
    component: KcPageStory,
    parameters: {
        layout: "fullscreen"
    }
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                logoutConfirm: {
                    code: "example-session-code",
                    skipLink: false
                },
                client: {
                    baseUrl: "#"
                }
            }}
        />
    )
};