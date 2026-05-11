import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/cn";

type PanelProps = {
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"section">, "children" | "className">;

export function Panel({ children, className, ...props }: PanelProps) {
  return (
    <section className={cn("panel", className)} {...props}>
      {children}
    </section>
  );
}
