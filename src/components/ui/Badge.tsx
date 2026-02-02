import { type ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export default function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-border bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-muted ${className}`}
    >
      {children}
    </span>
  );
}
