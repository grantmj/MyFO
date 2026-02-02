import Link from "next/link";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "gradient";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  href?: string;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 border-transparent",
  secondary:
    "bg-white/80 backdrop-blur text-foreground border border-primary-200/50 hover:bg-white hover:border-primary-300 hover:shadow-lg hover:-translate-y-0.5",
  ghost:
    "bg-transparent text-foreground hover:bg-surface-200/50 border-transparent",
  gradient:
    "bg-gradient-to-r from-primary-500 via-accent-500 to-success-500 text-white hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 border-transparent",
};

export default function Button({
  variant = "primary",
  children,
  className = "",
  href,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

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
