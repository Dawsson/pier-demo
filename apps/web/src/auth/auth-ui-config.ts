export const authUiConfig = {
  providers: [
    {
      enabled: true,
      id: "github",
      label: "GitHub",
    },
    {
      enabled: true,
      id: "microsoft",
      label: "Microsoft",
    },
  ],
  signUp: {
    fields: {
      name: {
        autoComplete: "name",
        enabled: true,
        label: "Name",
        placeholder: "Jane Doe",
      },
    },
  },
  fields: {
    email: {
      placeholder: "name@example.com",
    },
  },
  styles: {
    input: "!h-[42px] rounded-[10px] bg-background px-3 text-[0.9375rem] leading-none",
    oauthButton: "!h-11 min-w-0 justify-center rounded-[10px] text-[0.9375rem]",
    submitButton: "!h-[42px] rounded-[10px] font-semibold text-[0.9375rem]",
  },
} as const;

export type AuthProviderId = (typeof authUiConfig.providers)[number]["id"];
