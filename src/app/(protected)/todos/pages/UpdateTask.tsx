"use client";

import { useState } from "react";
import type { Task } from "../../../lib/type";
import AddTask from "../../../components/todo/AddTask";
import TaskList from "../../../components/todo/TaskList";

export default function TodosPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

 

  return (
    <div className="p-5 flex flex-col gap-5">
      <AddTask tasks={tasks} setTasks={setTasks} />
      <TaskList tasks={tasks} setTasks={setTasks} />
    </div>
  );
}
