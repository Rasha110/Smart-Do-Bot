import AuthForm from "@/components/auth/AuthForm";
import { AuthMode } from "@/components/auth/AuthForm";
export function SignInForm() {
  return <AuthForm mode={AuthMode.LOGIN} />
}
