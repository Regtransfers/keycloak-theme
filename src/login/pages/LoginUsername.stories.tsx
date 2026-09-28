import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "login-username.ftl" });

const meta = {
    title: "login/login-username.ftl",
    component: KcPageStory,
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => <KcPageStory />,
};

// Keycloak sets showTryAnotherWayLink when the flow has alternatives (e.g. magic
// link). The landing page deliberately doesn't show the link.
export const WithTryAnotherWayFlag: Story = {
    render: () => <KcPageStory kcContext={{ auth: { showTryAnotherWayLink: true } }} />,
};
