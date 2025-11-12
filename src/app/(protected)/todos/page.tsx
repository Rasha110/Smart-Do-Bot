"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase-client";
import AddTask from "../../components/todo/AddTask";
import TaskList from "../../components/todo/TaskList";
import type { Task } from "../../lib/type";



export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);

  
  // Fetch all tasks
  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Fetch todos error:", error.message);
    else setTasks(data || []);
  };
  useEffect(() => {
    fetchTodos();
  }, []);
  // Stats
  const totalTasks = tasks.length;
  const completedTasks = useMemo(
    () => tasks.filter((t) => t.is_completed).length,
    [tasks]
  );
  const remainingTasks = totalTasks - completedTasks;
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="max-w-2xl w-full space-y-8">
        
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Your Progress
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-gray-700">{totalTasks}</p>
              <p className="text-sm text-gray-500 mt-1">Total</p>
            </div>
            <div className="bg-green-100 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-700">
                {completedTasks}
              </p>
              <p className="text-sm text-gray-500 mt-1">Completed</p>
            </div>
            <div className="bg-blue-100 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-700">
                {remainingTasks}
              </p>
              <p className="text-sm text-gray-500 mt-1">Remaining</p>
            </div>
          </div>
        </section>
        {/* Add Task */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Add New Task
          </h2>
          <AddTask tasks={tasks} setTasks={setTasks} />
        </section>
        {/* Task List */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Tasks</h2>
          <TaskList tasks={tasks} setTasks={setTasks} />        </section>
      </div>
    </div>
  );
}