import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string, start = 4, end = 4) {
  if (!address) return "No address found";
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}
