"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation"; // Add this import
import { addTodo } from "@/app/actions/todos";
import { schema } from "@/app/lib/schema/schema";
import Button from "@/components/common/Button";

type FormInputs = { title: string; notes?: string };

export default function AddTask() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Add this

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInputs>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormInputs) => {
    setError(null);

    const formData = new FormData();
    formData.append("title", data.title);
    if (data.notes) {
      formData.append("notes", data.notes);
    }

    const result = await addTodo(formData);

    if (result.error) {
      setError(result.error);
    } else {
      reset();
      router.refresh(); // Add this line to force a refresh
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col max-w-3xl w-full"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <label className="text-gray-700 mb-3 mt-10">Write your task</label>
      <input
        {...register("title")}
        placeholder="Add your task"
        className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />
      {errors.title && (
        <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
      )}

      <Button 
        type="submit" 
        variant="primary" 
        className="mt-5 w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Adding..." : "Add"}
      </Button>
    </form>
  );
}