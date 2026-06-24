import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "federated-identity-confirm-link.ftl" });

const meta = {
  title: "account / federated-identity-confirm-link.ftl",
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
          type: "error",
          summary: "User with email <strong>ross@regtransfers.co.uk</strong> already exists. How do you want to continue?"
        }
      }}
    />
  ),
};

export const WithDifferentEmail: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        message: {
          type: "error",
          summary: "User with email <strong>user@example.com</strong> already exists. How do you want to continue?"
        }
      }}
    />
  ),
};
