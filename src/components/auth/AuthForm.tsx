"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { supabase } from "@/app/lib/supabase-client";
import Button from "@/components/common/Button";
import { getAuthSchema } from "@/app/lib/schema/schema";
import * as yup from "yup";

export enum AuthMode {
  LOGIN = "login",
  SIGNUP = "signup"
}

interface AuthFormProps {
  mode: AuthMode;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();

  const schema = getAuthSchema(mode);

  type AuthFormInputs = yup.InferType<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormInputs>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: AuthFormInputs) => {
    try {
      if (mode === AuthMode.SIGNUP) {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: { data: { full_name: data.name } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
      }

      router.push("/todos");
    } catch (error: any) {
      alert(error.message);
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

      {mode === AuthMode.SIGNUP && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            {...register("name")}
            placeholder="John Doe"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
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