import AuthForm from "@/components/auth/AuthForm";
import { AuthMode } from "@/app/lib/types/auth";

export function SignInForm() {
  return <AuthForm mode={AuthMode.LOGIN} />;
}