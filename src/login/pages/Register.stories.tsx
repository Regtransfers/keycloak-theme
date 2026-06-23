import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory, getKcContextMock } from "../KcPageStory";
import RegisterChoice from "./RegisterChoice";
import { useI18n } from "../i18n";

const { KcPageStory } = createKcPageStory({ pageId: "register.ftl" });

const meta = {
  title: "login/register.ftl",
  component: KcPageStory,
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const kcContext = getKcContextMock({
      pageId: "register.ftl",
      overrides: {},
    });
    function RegisterChoiceStory() {
      const { i18n } = useI18n({ kcContext });
      return <RegisterChoice kcContext={kcContext} i18n={i18n} googleLoginUrl="/mock-google" />;
    }
    return <RegisterChoiceStory />;
  },
};

export const SignUpWithEmail: Story = {
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
              fieldNames.includes("email")
            );
          },
          get: (fieldName: string) => {
            if (fieldName === "firstName") return "First name is required.";
            if (fieldName === "lastName") return "Last name is required.";
            if (fieldName === "mobileNumber") return "Mobile number is required.";
            if (fieldName === "email") return "Email already in use.";
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
