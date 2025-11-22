import { Task } from "@/app/lib/type";
import { atom } from "jotai";

// 1) Filter: all, active, completed
export const todoFilterAtom = atom<"all" | "completed" | "active">("all");

// 2) Currently editing todo (id only)
export const editingTodoIdAtom = atom<string | null>(null);

// 4) All tasks stored on client
export const tasksAtom = atom<Task[]>([]);

// 5) Selected task for editing or viewing notes
export const selectedTaskAtom = atom<Task | null>(null);

// 6) Loading state per-task
export const loadingAtom = atom<{ [id: string]: boolean }>({});

// 7) Modal system: add / edit / notes
export const todoModalAtom = atom<{
  open: boolean;
  type: "add" | "edit" | "notes" | null;
}>({
  open: false,
  type: null,
});

// 8) Search input
export const searchAtom = atom("");
