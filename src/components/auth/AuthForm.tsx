"use client";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Button from "@/components/common/Button";
import { getAuthSchema } from "@/app/lib/schema/schema";
import { signUp, signIn } from "@/app/actions/auth";
import * as yup from "yup";
import { useState } from "react";
import { AuthMode } from "@/app/lib/types/auth";
import { useRouter } from "next/navigation"; //

interface AuthFormProps {
  mode: AuthMode;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const schema = getAuthSchema(mode);
  type AuthFormInputs = yup.InferType<typeof schema>;

  const router = useRouter(); // 

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormInputs>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: AuthFormInputs) => {
    setError(null);

    try {
      if (mode === AuthMode.SIGNUP) {
        const { name, email, password } = data as { name: string; email: string; password: string };
        const result = await signUp({ name, email, password });

        if (result?.error) {
          setError(result.error);
        } else {
          router.push("/todos"); // ✅ redirect after successful sign-up
        }
      } else {
        const { email, password } = data as { email: string; password: string };
        const result = await signIn({ email, password });

        if (result?.error) {
          setError(result.error);
        } else {
          router.push("/todos"); // ✅ redirect after successful sign-in
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    }
  };

  return (
    <div className="w-[420px] h-[520px] flex items-center justify-center">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white w-full border border-gray-200 rounded-lg shadow-sm p-10 space-y-4 "
      >
        <h2 className="text-xl font-semibold text-gray-800">
          {mode === AuthMode.SIGNUP ? "Sign Up" : "Sign In"}
        </h2>
        <p className="text-sm text-gray-500">
          {mode === AuthMode.SIGNUP
            ? "Create a new account to get started"
            : "Enter your email and password to access your account"}
        </p>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {mode === AuthMode.SIGNUP && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              {...register("name" as any)}
              placeholder="John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {("name" in errors) && <p className="text-red-500 text-sm">{(errors as any).name?.message}</p>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            {...register("email")}
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            {...register("password")}
            placeholder="********"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} variant="primary" className="w-full">
          {isSubmitting ? "Please wait..." : mode === AuthMode.SIGNUP ? "Sign Up" : "Sign In"}
        </Button>
      </form>
    </div>
  );
}