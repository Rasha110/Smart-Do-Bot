"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import Button from "@/components/common/Button";
import type { Task } from "@/app/lib/type";
import { deleteTodo } from "@/app/actions/todos"; // ←

type Props = {
  task: Task;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
};

export default function DeleteTask({ task, tasks, setTasks }: Props) {
  const handleDelete = async () => {
    // Optimistic UI update
    setTasks((prev) => prev.filter((t) => t.id !== task.id));

    const result = await deleteTodo(task.id);

    if (result?.error) {
      console.error("Delete error:", result.error);

 
      setTasks(tasks);
    }
  };

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
}
