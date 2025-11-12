"use client";

import { useState } from "react";
import DeleteTask from "../../../components/todo/DeleteTask";
import type { Task } from "../../../lib/type";

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([ ]);

  return (
    <div>
    {tasks.map((task) => (
      <div key={task.id} className="flex items-center mb-2">
        <span>{task.title}</span>
        <DeleteTask task={task} tasks={tasks} setTasks={setTasks} />
      </div>
    ))}
  </div>
    
    
  );
}
