import { z } from "zod";

export const registerFormSchema = z.object({
  // School fields
  schoolName: z.string()
    .min(2, { message: "School name must be at least 2 characters" })
    .max(150, { message: "School name must be under 150 characters" }),
  address: z.string()
    .min(5, { message: "Address is required" }),
  province: z.string()
    .min(2, { message: "Province is required" })
    .max(100, { message: "Province must be under 100 characters" }),
  schoolPhone: z.string()
    .min(7, { message: "School phone is required" })
    .max(20, { message: "Phone must be under 20 characters" }),
  schoolEmail: z.string()
    .email({ message: "Invalid school email address" }),

  // Headmaster fields
  firstName: z.string()
    .min(2, { message: "First name must be at least 2 characters" })
    .max(100, { message: "First name must be under 100 characters" }),
  lastName: z.string()
    .min(2, { message: "Last name must be at least 2 characters" })
    .max(100, { message: "Last name must be under 100 characters" }),
});


export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const defaultRegisterValues: RegisterFormValues = {
  schoolName: "",
  address: "",
  province: "",
  schoolPhone: "",
  schoolEmail: "",
  firstName: "",
  lastName: "",
  
};