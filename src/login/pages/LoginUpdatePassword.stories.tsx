import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "login-update-password.ftl" });

const meta = {
  title: "login/login-update-password.ftl",
  component: KcPageStory,
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <KcPageStory />,
};

export const WithPasswordMismatch: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        messagesPerField: {
          existsError: (fieldName: string, ...otherFieldNames: string[]) => {
            const fieldNames = [fieldName, ...otherFieldNames];
            return fieldNames.includes("password-confirm");
          },
          get: (fieldName: string) => {
            if (fieldName === "password-confirm") return "Passwords do not match.";
            return "";
          },
        },
      }}
    />
  ),
};
