"use client";

import React, { useState } from "react";
import { supabase } from "@/app/lib/supabase-client";
import { Dialog } from "@headlessui/react";
import { Task } from "@/app/lib/type";
import { NotebookPen } from "lucide-react";

interface DialogNotesProps {
  task: Task;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const DialogNotes: React.FC<DialogNotesProps> = ({ task, setTasks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(task.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const handleSaveNotes = async () => {
    if (!task.id) return;

    setIsSaving(true);

    const { error } = await supabase
      .from("todos")
      .update({ notes })
      .eq("id", task.id);

    if (error) {
      console.error("Error saving notes:", error.message);
      setIsSaving(false);
      return;
    }

    const updatedTask = { ...task, notes };
    setTasks(prevTasks =>
      prevTasks.map(t => (t.id === task.id ? updatedTask : t))
    );

    setTimeout(() => {
      supabase.functions.invoke('sync-embeddings', {
        method: 'GET' 
      })
        .then(({  error: embError }) => {
          if (embError) {
            console.error('⚠️ Embedding update failed:', embError);
          } 
        });
    }, 500);

    setIsSaving(false);
    handleClose();
  };

  return (
    <>
      <NotebookPen
        className="w-6 h-6 cursor-pointer"
        onClick={handleOpen}
      />

      <Dialog open={isOpen} onClose={handleClose}>
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
          <Dialog.Panel className="bg-white p-6 rounded-lg max-w-lg w-full shadow-lg">
            <h1 className="text-xl font-semibold">
              Notes for Task
            </h1>
            <h2 className="text-sm mt-2 mb-4">
              {task.title}
            </h2>

            <textarea
              placeholder="Enter your notes here..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md"
              rows={6}
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};

export default DialogNotes;