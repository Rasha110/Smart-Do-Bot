"use client"
import React, { useEffect } from "react";
import { Trash2 } from "lucide-react";
import Button from "@/components/common/Button";
import type { Task } from "@/app/lib/type";
import { supabase } from "@/app/lib/supabase-client";

type Props = {
  task: Task;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
};

const DeleteTask: React.FC<Props> = ({ task, tasks, setTasks }) => {
  const handleDelete = async () => {
    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", task.id);

    if (error) {
      console.error("Error deleting task:", error.message);
      return;
    }

    setTasks(tasks.filter((t) => t.id !== task.id));
  };

  useEffect(() => {
    const channel = supabase
      .channel("todos-deletes")
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "todos",
        },
        (payload) => {
          const deletedTask = payload.old as Task;
          setTasks((prev) => prev.filter((t) => t.id !== deletedTask.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); 
    };
  }, [setTasks]);

  return (
    <Button
      onClick={handleDelete}
      size="sm" 
      variant="danger" 
      className="ml-2 p-2 flex items-center justify-center"
    >
      <Trash2 size={15} />
    </Button>
  );
};

export default DeleteTask;