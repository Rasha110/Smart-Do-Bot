import { getTodos } from "@/app/actions/todos";
import AddTask from "@/components/todo/AddTask";
import TaskList from "@/components/todo/TaskList";
import { redirect } from "next/navigation";
import FilterBar from "@/components/todo/FilterBar";

export default async function TodosPage() {
  const { data: tasks, error } = await getTodos();

  if (error === "Not authenticated") {
    redirect("/signin");
  }

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((t) => t.is_completed).length || 0;
  const remainingTasks = totalTasks - completedTasks;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Stats */}
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
          <AddTask />
        </section>
        <FilterBar /> 
        {/* Task List */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Tasks</h2>
          <TaskList initialTasks={tasks || []} />
        </section>
      </div>
    </div>
  );
}