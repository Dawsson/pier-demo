export const authUiConfig = {
  providers: [
    {
      id: "github",
      label: "GitHub",
    },
    {
      id: "microsoft",
      label: "Microsoft",
    },
  ],
  signUp: {
    requireName: true,
  },
} as const;

export type AuthProviderId = (typeof authUiConfig.providers)[number]["id"];
