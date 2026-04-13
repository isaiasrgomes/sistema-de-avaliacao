import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNota(n: number | string | null | undefined) {
  if (n == null) return "—";
  return Number(n).toFixed(2);
}
