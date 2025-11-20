import AuthForm, { AuthMode } from "@/components/auth/AuthForm";

export function SignInForm() {

  return <AuthForm mode={AuthMode.LOGIN} />;
}
