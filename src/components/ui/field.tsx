import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="text-ink/80">{label}</span>
      <input
        className={cn(
          "glass-subtle w-full rounded-2xl px-4 py-3 text-ink placeholder:text-ink/45 outline-none ring-gold/50 transition focus:ring-2",
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
      <span className="text-ink/80">{label}</span>
      <textarea
        className={cn(
          "glass-subtle min-h-28 w-full rounded-2xl px-4 py-3 text-ink placeholder:text-ink/45 outline-none ring-gold/50 transition focus:ring-2",
          className,
        )}
        {...props}
      />
    </label>
  );
}
