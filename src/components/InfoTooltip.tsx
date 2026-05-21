import { Info } from "lucide-react";
import type { ReactNode } from "react";

export function InfoTooltip({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="group/tooltip relative inline-flex items-center gap-1.5">
      <span className="decoration-dotted underline-offset-4 group-hover/tooltip:underline">
        {label}
      </span>
      <Info className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-72 rounded-md border border-border bg-white p-3 text-xs normal-case leading-5 tracking-normal text-foreground shadow-lg group-hover/tooltip:block group-focus-within/tooltip:block"
      >
        {children}
      </span>
    </span>
  );
}
