"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { supabase } from "@/app/lib/supabase-client";
import {schema} from "@/app/lib/schema/schema"
import Button from "@/components/common/Button";
import type { Task } from "@/app/lib/type";
type FormInputs = { title: string };
type AddTaskProps = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
};
export default function AddTask({ tasks, setTasks }: AddTaskProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: yupResolver(schema) as any,
  });
  const addTask = async (title: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return ;
    const { data, error } = await supabase
      .from("todos")
      .insert([{ title, is_completed: false, user_id: user.id }])
      .select();
    if (error) {
      console.error("Insert error:", error.message);
      return;
    }
    if (data && data.length > 0) {
      const newTask = data[0] as Task;
      setTasks((prev) => [newTask, ...prev]);
    }
  };

 
  useEffect(() => {
    
    const channel = supabase
      .channel("todos-inserts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "todos",
        },
        (payload) => {
          const newTask = payload.new as Task;
          setTasks((prev) => [newTask, ...prev]);
        }
      )
      .subscribe();
   

 return () => {
      supabase.removeChannel(channel);
    };
  }, [setTasks]);

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        await addTask(data.title);
        reset();
      })}
      className="flex flex-col max-w-3xl w-full"
    >
      <label className="text-gray-700 mb-3 mt-10">Write your task</label>
      <input
        {...register("title")}
        placeholder="Add your task"
        className="border p-3 "
      />
      {errors.title && (
        <p className="text-red-500 text-sm">{errors.title.message}</p>
      )}
     <Button type="submit" variant="primary"  className="mt-5 w-full">
        Add
      </Button>
    </form>
  );
}