
"use client";

import React from "react";
import { Check } from "lucide-react";
import { supabase } from "@/app/lib/supabase-client";
import type { Task } from "@/app/lib/type";
import DeleteTask from "@/components/todo/DeleteTask";
import UpdateTask from "@/components/todo/UpdateTask";
import Button from "@/components/common/Button";
import DialogNotes from "@/components/todo/DialogNotes"; 

type Props = {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
};

const TaskList: React.FC<Props> = ({ tasks, setTasks }) => {

  const toggleComplete = async (id: string, current: boolean) => {
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from("todos")
      .update({ 
        is_completed: !current,
        updated_at: now 
      })
      .eq("id", id);

    if (error) return console.error("Toggle error:", error.message);

    setTasks(prev =>
      prev.map(task => 
        task.id === id 
          ? { ...task, is_completed: !current, updated_at: now } 
          : task
      )
    );
  };

  const uniqueTasks = Array.from(new Map(tasks.map(t => [t.id, t])).values());

  return (
    <div>
      <ul className="mt-5 w-full max-w-3xl">
        {uniqueTasks.map(task => (
          <li
            key={task.id}
            className="flex flex-col mt-5 bg-blue-300 p-4 rounded-lg text-white min-w-[400px]"
          >
            <div className="flex flex-row items-center justify-between">
              <span
                onClick={() => toggleComplete(task.id, task.is_completed)}
                className={`flex-1 cursor-pointer ${
                  task.is_completed ? "line-through text-white/70" : ""
                }`}
              >
                {task.title}
                {task.notes && (
                  <p className="mt-2 text-sm text-white/80">{task.notes}</p>
                )}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => toggleComplete(task.id, task.is_completed)}
                  variant="primary"
                  className="p-2"
                  size="sm"
                >
                  <Check size={15} />
                </Button>

                <DialogNotes task={task} setTasks={setTasks} />
                <UpdateTask task={task} tasks={tasks} setTasks={setTasks} />
                <DeleteTask task={task} tasks={tasks} setTasks={setTasks} />
              </div>
            </div>

            <span className="text-xs text-white/70 mt-2">
              Created:{" "}
              {task.created_at
                ? new Date(task.created_at).toLocaleString()
                : "-"}{" "}
              | Updated:{" "}
              {task.updated_at
                ? new Date(task.updated_at).toLocaleString()
                : "-"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;
