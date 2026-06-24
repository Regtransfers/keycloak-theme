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
      kcContext={{
        profile: {
          attributesByName: {
            firstName: {
              name: "firstName",
              value: "",
              displayName: "First Name",
              required: true,
              readOnly: false,
              validators: {},
              annotations: {},
              values: []
            },
            lastName: {
              name: "lastName",
              value: "",
              displayName: "Last Name",
              required: true,
              readOnly: false,
              validators: {},
              annotations: {},
              values: []
            },
            mobileNumber: {
              name: "mobileNumber",
              value: "",
              displayName: "Mobile Number",
              required: false,
              readOnly: false,
              validators: {},
              annotations: {},
              values: []
            }
          }
        }
      }}
    />
  ),
};

export const WithoutLastName: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        profile: {
          attributesByName: {
            firstName: {
              name: "firstName",
              value: "John",
              displayName: "First Name",
              required: true,
              readOnly: false,
              validators: {},
              annotations: {},
              values: []
            },
            mobileNumber: {
              name: "mobileNumber",
              value: "",
              displayName: "Mobile Number",
              required: false,
              readOnly: false,
              validators: {},
              annotations: {},
              values: []
            }
            // lastName intentionally omitted
          }
        }
      }}
    />
  ),
};

export const WithError: Story = {
  render: () => (
    <KcPageStory
      kcContext={{
        message: {
          type: "error",
          summary: "Please fill in all required fields."
        },
        profile: {
          attributesByName: {
            firstName: {
              name: "firstName",
              value: "",
              displayName: "First Name",
              required: true,
              readOnly: false,
              validators: {},
              annotations: {},
              values: []
            },
            lastName: {
              name: "lastName",
              value: "",
              displayName: "Last Name",
              required: true,
              readOnly: false,
              validators: {},
              annotations: {},
              values: []
            },
            mobileNumber: {
              name: "mobileNumber",
              value: "",
              displayName: "Mobile Number",
              required: false,
              readOnly: false,
              validators: {},
              annotations: {},
              values: []
            }
          }
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
        },
        profile: {
          attributesByName: {
            firstName: {
              name: "firstName",
              value: "",
              displayName: "First Name",
              required: true,
              readOnly: false,
              validators: {},
              annotations: {},
              values: []
            },
            lastName: {
              name: "lastName",
              value: "",
              displayName: "Last Name",
              required: true,
              readOnly: false,
              validators: {},
              annotations: {},
              values: []
            },
            mobileNumber: {
              name: "mobileNumber",
              value: "",
              displayName: "Mobile Number",
              required: false,
              readOnly: false,
              validators: {},
              annotations: {},
              values: []
            }
          }
        }
      }}
    />
  ),
};
