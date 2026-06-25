import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "update-email.ftl" });

const meta = {
    title: "login/update-email.ftl",
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
                profile: {
                    attributesByName: {
                        email: {
                            name: "email",
                            displayName: "Email",
                            value: "ross@example.com",
                            required: true,
                            readOnly: false,
                            validators: {}
                        }
                    }
                }
            }}
        />
    )
};