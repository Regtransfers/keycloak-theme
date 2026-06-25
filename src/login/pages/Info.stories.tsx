import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "info.ftl" });

const meta = {
    title: "login/info.ftl",
    component: KcPageStory,
    parameters: {
        layout: "fullscreen"
    }
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EmailValidation: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                messageHeader: "Email address validation",
                message: {
                    type: "info",
                    summary: "Confirm validity of e-mail address fevit20621@adsprite.com."
                },
                actionUri: "#"
            }}
        />
    )
};

export const AlreadyVerified: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                messageHeader: "Email address verified",
                message: {
                    type: "success",
                    summary: "Your email address has been verified already."
                },
                skipLink: true
            }}
        />
    )
};