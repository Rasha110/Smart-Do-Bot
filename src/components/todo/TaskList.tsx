"use client";

import React from "react";
import { Check } from "lucide-react";
import type { Task } from "@/app/lib/type";
import DeleteTask from "@/components/todo/DeleteTask";
import UpdateTask from "@/components/todo/UpdateTask";
import Button from "@/components/common/Button";
import DialogNotes from "@/components/todo/DialogNotes";
import { toggleTodo } from "@/app/actions/todos";
import { useAtomValue } from "jotai";
import { todoFilterAtom } from "../../../atoms/todoAtoms";
type Props = {
  initialTasks: Task[];
};

const TaskList: React.FC<Props> = ({ initialTasks }) => {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    React.startTransition(async () => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, is_completed: !t.is_completed }
            : t
        )
      );
      

      // Call server action
      const result = await toggleTodo(id, currentStatus);
      if (result.error) {
        console.error("Toggle error:", result.error);

        // Revert optimistic change on failure
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, is_completed: currentStatus } : t
          )
        );
      }
    });
  };

  const filter = useAtomValue(todoFilterAtom);

const filteredTasks = tasks.filter((task) => {
  if (filter === "completed") return task.is_completed;
  if (filter === "active") return !task.is_completed;
  return true;
});


  return (
    <div>
      <ul className="mt-5 w-full max-w-3xl">
      {filteredTasks.map((task) => (

          <li
            key={task.id}
            className="flex flex-col mt-5 bg-blue-300 p-4 rounded-lg text-white min-w-[400px]"
          >
            <div className="flex flex-row items-center justify-between">
              <span
                onClick={() => handleToggle(task.id, task.is_completed)}
                className={`flex-1 cursor-pointer ${
                  task.is_completed ? "line-through text-white/70" : ""
                }`}
              >
                {task.title}
                {task.notes && <p className="mt-2 text-sm text-white/80">{task.notes}</p>}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleToggle(task.id, task.is_completed)}
                  variant="primary"
                  className="p-2"
                  size="sm"
                >
                  <Check size={15} />
                </Button>

                <DialogNotes task={task} />
                <UpdateTask task={task} tasks={tasks} setTasks={setTasks} />
                <DeleteTask task={task} tasks={tasks} setTasks={setTasks} />
              </div>
            </div>

            <span className="text-xs text-white/70 mt-2">
              Created:{" "}
              {task.created_at ? new Date(task.created_at).toLocaleString("en-GB") : "-"} | Updated:{" "}
              {task.updated_at ? new Date(task.updated_at).toLocaleString("en-GB") : "-"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;