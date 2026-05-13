import { z } from "zod";

export const resetPasswordFormSchema = z.object({
    newPassword: z.string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/\d/, { message: "Password must contain at least one number" })
      .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter" }),
    newPasswordConfirmation: z.string()
      .min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirmation, {
    message: "Passwords do not match",
    path: ["newPasswordConfirmation"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

export const defaultResetPasswordValues: ResetPasswordFormValues = {
  newPassword: "",
  newPasswordConfirmation: "",
};