"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type FloatingFieldProps = Omit<React.ComponentProps<"input">, "placeholder"> & {
  id: string;
  label: string;
};

function FloatingField({
  id,
  label,
  className,
  ...props
}: FloatingFieldProps) {
  return (
    <div className="relative">
      <input
        id={id}
        data-slot="floating-field"
        // Single space keeps :placeholder-shown working so the label can float.
        placeholder=" "
        className={cn(
          "peer h-14 w-full rounded-[1.125rem] border border-input bg-background px-4 pt-5 pb-1.5 text-[0.95rem] text-foreground outline-none transition-[border-color,box-shadow] duration-200 ease-out",
          "focus-visible:border-foreground focus-visible:ring-4 focus-visible:ring-foreground/10",
          "aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/15",
          "disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[0.95rem] font-normal text-muted-foreground transition-all duration-200 ease-out",
          // Floated state: input focused OR holding a value.
          "peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-medium peer-focus:text-foreground",
          "peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium",
          "peer-aria-invalid:text-destructive",
        )}
      >
        {label}
      </label>
    </div>
  );
}

export { FloatingField };
