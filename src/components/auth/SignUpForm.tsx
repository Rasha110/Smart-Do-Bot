import AuthForm from "@/components/auth/AuthForm";
import { AuthMode } from "@/app/lib/types/auth";

export function SignUpForm() {
  return <AuthForm mode={AuthMode.SIGNUP} />;
}