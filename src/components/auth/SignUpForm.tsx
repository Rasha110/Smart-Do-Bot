import AuthForm, { AuthMode } from "@/components/auth/AuthForm";

export function SignUpForm() {
    console.log("SignUpForm AuthMode.SIGNUP:", AuthMode.SIGNUP); // should log "signup"

  return <AuthForm mode={AuthMode.SIGNUP} />;
}
