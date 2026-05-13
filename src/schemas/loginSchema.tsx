import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const defaultLoginValues: LoginFormValues = {
  email: "",
  password: "",
};