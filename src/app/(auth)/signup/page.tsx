import { SignUpForm } from "@/components/auth/SignUpForm";
import Link from "next/link";
export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create an account</h1>
          <p className="text-gray-500 mt-2">
            Get started with your todo list today
          </p>
        </div>
        <SignUpForm />
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link href="/signin" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}