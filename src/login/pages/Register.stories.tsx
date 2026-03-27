import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "register.ftl" });

const meta = {
  title: "login/register.ftl",
  component: KcPageStory,
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <KcPageStory />,
};

export const WithFieldErrors: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        messagesPerField: {
          existsError: (fieldName: string, ...otherFieldNames: string[]) => {
            const fieldNames = [fieldName, ...otherFieldNames];
            return (
              fieldNames.includes("firstName") ||
              fieldNames.includes("lastName") ||
              fieldNames.includes("mobileNumber") ||
              fieldNames.includes("email") ||
              fieldNames.includes("password-confirm")
            );
          },
          get: (fieldName: string) => {
            if (fieldName === "firstName") return "First name is required.";
            if (fieldName === "lastName") return "Last name is required.";
            if (fieldName === "mobileNumber") return "Mobile number is required.";
            if (fieldName === "email") return "Email already in use.";
            if (fieldName === "password-confirm") return "Passwords do not match.";
            return "";
          },
        },
      }}
    />
  ),
};

export const WithoutPasswordFields: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        passwordRequired: false,
      }}
    />
  ),
};
