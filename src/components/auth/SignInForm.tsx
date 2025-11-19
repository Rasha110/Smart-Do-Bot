import AuthForm, { AuthMode } from "./AuthForm";

export function SignInForm() {
  return <AuthForm mode={AuthMode.LOGIN} />;
}