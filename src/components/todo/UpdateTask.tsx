"use client";

import { useState } from "react";
import { updateTodo } from "@/app/actions/todos";
import Button from "@/components/common/Button";
import type { Task } from "@/app/lib/type";

interface UpdateTaskProps {
  task: Task;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function UpdateTask({ task, tasks, setTasks }: UpdateTaskProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);

  return (
    <form
    action={async (formData: FormData) => {
      const newTitle = formData.get("title") as string;
      if (!newTitle.trim()) return;
  
      // Optimistic UI update (optional)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, title: newTitle.trim() } : t
        )
      );
  
      // Call server action
      const result = await updateTodo(task.id, { title: newTitle.trim() });
  
      if (result.error) {
        console.error("Update failed:", result.error);
        // Revert optimistic update
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? task : t))
        );
      } else if (result.data) {
        // Update the task in state with the server's full updated task
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? result.data : t))
        );
        setIsEditing(false);
      }
    }}
    className="ml-2 flex items-center gap-2"
  >
  
      {isEditing ? (
        <>
          <input
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-1 rounded text-blue-600 bg-white outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />

          <Button type="submit" variant="primary" size="sm" className="p-1">
            Save
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="p-1"
            onClick={() => {
              setIsEditing(false);
              setTitle(task.title);
            }}
          >
            Cancel
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="p-1"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
      )}
    </form>
  );
}