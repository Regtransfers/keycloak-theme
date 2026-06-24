import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "login-idp-link-email.ftl" });

const meta = {
  title: "login / login-idp-link-email.ftl",
  component: KcPageStory,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <KcPageStory
      {...args}
      kcContext={{
        message: {
          type: "warning",
          summary: "You need to verify your email address to link your account with Google."
        }
      }}
    />
  ),
};

export const GoogleProvider: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        idpAlias: "google",
        username: "ross@regtransfers.co.uk",
        message: {
          type: "warning",
          summary: "You need to verify your email address to link your account with Google."
        }
      }}
    />
  ),
};
