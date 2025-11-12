import * as yup from "yup";
export const schema = yup.object({
    title: yup.string().required("Title is required"),
  });
  





export const getAuthSchema = (mode: "signup" | "login") =>
    yup.lazy(() => {
      return yup.object({
        name:
          mode === "signup"
            ? yup.string().required("Name is required")
            : yup.string().notRequired(),
        email: yup.string().email("Invalid email").required("Email is required"),
        password: yup.string().min(6, "Password must be at least 6 characters").required(),
      });
    });
  
