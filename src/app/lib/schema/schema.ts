import * as yup from "yup";
import { AuthMode } from "@/components/auth/AuthForm";

export const schema = yup.object({
    title: yup.string().required("Title is required"),
});

export const getAuthSchema = (mode: AuthMode) => {
  if (mode === AuthMode.SIGNUP) {
    return yup.object({
      name: yup.string().required("Name is required"),
      email: yup.string().email("Invalid email").required("Email is required"),
      password: yup.string().min(6, "Password must be at least 6 characters").required(),
    });
  }
  else{
  return yup.object({
    email: yup.string().email("Invalid email").required("Email is required"),
    password: yup.string().min(6, "Password must be at least 6 characters").required(),
  });
}};