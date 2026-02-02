import { Link } from "react-router-dom";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  to?: string;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-foreground text-white hover:bg-neutral-800 border-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-foreground",
  secondary:
    "bg-white text-foreground border border-border hover:bg-neutral-50 hover:border-neutral-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-foreground",
  ghost:
    "bg-transparent text-foreground hover:bg-neutral-100 border-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-foreground",
};

export default function Button({
  variant = "primary",
  children,
  className = "",
  to,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium transition-colors duration-150 disabled:opacity-50";

  const combined = `${base} ${variantStyles[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={combined}>
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
