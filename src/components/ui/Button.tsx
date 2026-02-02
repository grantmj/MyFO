import Link from "next/link";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  href?: string;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent/90 border-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent",
  secondary:
    "bg-white text-foreground border border-border hover:bg-surface hover:border-accent/50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent",
  ghost:
    "bg-transparent text-foreground hover:bg-surface border-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent",
};

export default function Button({
  variant = "primary",
  children,
  className = "",
  href,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium transition-colors duration-150 disabled:opacity-50";

  const combined = `${base} ${variantStyles[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combined}>
        {children}
      </Link>
    );
  }

  return (
    <button type={props.type ?? "button"} className={combined} {...props}>
      {children}
    </button>
  );
}
