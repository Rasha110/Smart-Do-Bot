import AuthForm, { AuthMode } from "./AuthForm";

export function SignUpForm() {
  return <AuthForm mode={AuthMode.SIGNUP} />;
}