import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "update-user-profile.ftl" });

const meta = {
  title: "account / update-user-profile.ftl",
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
      kcContext={{}}
    />
  ),
};

export const WithError: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        message: {
          type: "error",
          summary: "Email address is already in use."
        }
      }}
    />
  ),
};

export const WithSuccess: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        message: {
          type: "success",
          summary: "Your account information has been updated successfully."
        }
      }}
    />
  ),
};
