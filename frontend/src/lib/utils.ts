import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with precedence for later classes. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}