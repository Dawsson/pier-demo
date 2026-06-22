import { z } from "zod";
import { authUiConfig } from "@/auth/auth-ui-config";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

const signUpShape = {
  email: z.email("Enter a valid email address."),
  name: authUiConfig.signUp.fields.name.enabled
    ? z.string().trim().min(2, "Enter your name.")
    : z.string().trim().optional(),
  password: z.string().min(8, "Use at least 8 characters."),
};

export const signUpSchema = z.object(signUpShape);

export type LoginValues = z.infer<typeof loginSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
