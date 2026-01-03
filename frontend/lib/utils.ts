import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatCurrency(amount: bigint | number, decimals: number = 18): string {
  const num = typeof amount === "bigint" ? Number(amount) / 10 ** decimals : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(num: number | bigint): string {
  const n = typeof num === "bigint" ? Number(num) : num;
  return new Intl.NumberFormat("en-US").format(n);
}

