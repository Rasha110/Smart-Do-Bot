"use client";

import { useAtom } from "jotai";
import { todoFilterAtom } from "../../../atoms/todoAtoms";

const filterButtons = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

export default function FilterBar() {
  const [filter, setFilter] = useAtom(todoFilterAtom);

  return (
    <div className="flex gap-3 items-center justify-center my-6">
      {filterButtons.map(({ key, label }) => {
        const isActive = filter === key;

        return (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all 
              ${isActive 
                ? "bg-blue-600 text-white shadow-md scale-105" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }
            `}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
