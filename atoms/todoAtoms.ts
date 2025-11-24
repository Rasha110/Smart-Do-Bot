import { atom } from "jotai";

// 1) Filter: all, active, completed
export const todoFilterAtom = atom<"all" | "completed" | "active">("all");


