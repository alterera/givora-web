import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="text-ink/70">{label}</span>
      <input
        className={cn(
          "w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 outline-none ring-gold/40 focus:ring-2",
          className,
        )}
        {...props}
      />
    </label>
  );
}

export function TextArea({
  label,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="text-ink/70">{label}</span>
      <textarea
        className={cn(
          "min-h-28 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 outline-none ring-gold/40 focus:ring-2",
          className,
        )}
        {...props}
      />
    </label>
  );
}
