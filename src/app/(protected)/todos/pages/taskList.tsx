"use client";

import { useState } from "react";
import TaskList from "../../../components/todo/TaskList";
import AddTask from "../../../components/todo/AddTask";
import type { Task } from "../../../lib/type";

export default function TodosPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

 
 

  return (
    <div className="p-5">
      <TaskList tasks={tasks} setTasks={setTasks} />
    </div>
  );
}
