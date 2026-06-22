export const authUiConfig = {
  oauthProviders: [
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

export const authOAuthProviders = authUiConfig.oauthProviders;

export type AuthProviderId = (typeof authUiConfig.oauthProviders)[number]["id"];
