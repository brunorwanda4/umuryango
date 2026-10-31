import { Loader2Icon } from "lucide-react";
import { createTranslator } from "@/i18n/translate";
import { cn } from "@/lib/utils";

const t = createTranslator("Common");

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label={props["aria-label"] ?? t((m) => m.Common.loading)}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
