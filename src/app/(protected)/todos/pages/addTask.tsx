"use client"; 

import { useState } from "react";
import AddTask from "../../../components/todo/AddTask";
import type { Task } from "../../../lib/type";

export default function AddTaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  return (
    <div>
      <AddTask tasks={tasks} setTasks={setTasks} />
    </div>
  );
}
