"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Button from "@/components/common/Button";
import { getAuthSchema } from "@/app/lib/schema/schema";
import { useState } from "react";
import { signIn, signUp } from "@/app/actions/auth";
export enum AuthMode {
  LOGIN = "login",
  SIGNUP = "signup"
}

interface AuthFormProps {
  mode: AuthMode;
}

// Define explicit types for both forms
type SignupFormInputs = {
  name: string;
  email: string;
  password: string;
};

type LoginFormInputs = {
  email: string;
  password: string;
};

type AuthFormInputs = SignupFormInputs | LoginFormInputs;

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  
  const schema = getAuthSchema(mode);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormInputs>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: AuthFormInputs) => {
    setError(null);
  
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);
  
    if (mode === AuthMode.SIGNUP) {
      formData.append("name", (data as SignupFormInputs).name);
    }
  
    try {
      const result =
        mode === AuthMode.SIGNUP ? await signUp(formData) : await signIn(formData);
  
      if (result?.error) setError(result.error);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 space-y-4"
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
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
          {"name" in errors && <p className="text-red-500 text-sm">{(errors as any).name?.message}</p>}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
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
  );
}