import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number | string,
  currency: string = "EUR"
): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPercent(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function valueColorClass(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num > 0) return "text-on-tertiary-container bg-tertiary-fixed";
  if (num < 0) return "text-on-error-container bg-error-container";
  return "text-on-surface-variant";
}

export function signedValue(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num > 0 ? `+${formatCurrency(num)}` : formatCurrency(num);
}
