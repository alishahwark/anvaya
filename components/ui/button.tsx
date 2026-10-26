import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";
export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) { return <button className={cn("sans rounded-full bg-[#19342e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2b5147] disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />; }
