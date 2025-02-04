import { ALL_MODEL_NAMES } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitialMessageRole(
  name: ALL_MODEL_NAMES,
): "system" | "user" {
  if (name.startsWith("o1")) {
    return "user";
  } else {
    return "system";
  }
}
