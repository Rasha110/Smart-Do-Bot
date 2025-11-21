import { atom } from "jotai";

export const todoFilterAtom = atom<"all" | "completed" | "active">("all");

export const editingTodoIdAtom = atom<string | null>(null);

export const themeAtom = atom<"light" | "dark">("light");
