import AuthForm, { AuthMode } from "@/components/auth/AuthForm";

export function SignUpForm() {
  return <AuthForm mode={AuthMode.SIGNUP} />;
}