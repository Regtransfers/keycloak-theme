import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "error.ftl" });

const meta = {
    title: "login/error.ftl",
    component: KcPageStory,
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                message: {
                    summary: "Invalid parameter: redirect_uri",
                },
                status: "Invalid parameter",
            }}
        />
    ),
};

export const WithoutMessage: Story = {
    render: () => <KcPageStory kcContext={{}} />,
};

export const WithSessionExpired: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                message: {
                    summary: "Your session has expired. Please sign in again.",
                },
                status: "Session Expired",
            }}
        />
    ),
};
