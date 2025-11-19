"use client";

import { useState, useTransition } from "react";
import { updateTodo } from "@/app/actions/todos";
import Button from "@/components/common/Button";
import type { Task } from "@/app/lib/type";
import { FileText } from "lucide-react";

interface DialogNotesProps {
  task: Task;
}

export default function DialogNotes({ task }: DialogNotesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(task.notes || "");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateTodo(task.id, { notes: notes.trim() || null });

      if (result.error) {
        console.error("Error updating notes:", result.error);
        alert(result.error);
      } else {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="primary"
        size="sm"
        className="p-2"
      >
        <FileText size={15} />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Edit Notes</h3>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-gray-800"
              rows={5}
              placeholder="Add notes about this task..."
              disabled={isPending}
            />

            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => setIsOpen(false)}
                variant="secondary"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="primary"
                disabled={isPending}
              >
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
