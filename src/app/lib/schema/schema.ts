import * as yup from "yup";
import { AuthMode } from "@/app/lib/types/auth";

export const schema = yup.object({
    title: yup.string().required("Title is required"),
});

export const getAuthSchema = (mode: AuthMode) => {
    const baseSchema = {
      email: yup
        .string()
        .email("Please enter a valid email")
        .required("Email is required"),
      password: yup
        .string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
    };
  
    if (mode === AuthMode.SIGNUP) {
      return yup.object().shape({
        ...baseSchema,
        name: yup
          .string()
          .required("Name is required")
          .min(2, "Name must be at least 2 characters"),
      });
    }
  
    return yup.object().shape(baseSchema);
  };