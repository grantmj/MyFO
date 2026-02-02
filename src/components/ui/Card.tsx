import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "glass" | "glow" | "highlight";
  animate?: boolean;
}

export default function Card({
  children,
  className = "",
  variant = "default",
  animate = true,
}: CardProps) {
  const baseStyles = "rounded-2xl p-6 transition-all duration-300";

  const variantStyles = {
    default: `
      bg-white/90 backdrop-blur-xl
      border border-white/50
      shadow-[0_8px_32px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.5)_inset]
      hover:shadow-[0_16px_48px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.6)_inset]
      hover:-translate-y-1
    `,
    glass: `
      glass-card
    `,
    glow: `
      bg-white/90 backdrop-blur-xl
      border border-primary-200/50
      shadow-[0_8px_32px_rgba(102,126,234,0.15)]
      hover:shadow-[0_16px_48px_rgba(102,126,234,0.25)]
      hover:-translate-y-1
    `,
    highlight: `
      bg-gradient-to-br from-primary-500/10 to-accent-500/10
      backdrop-blur-xl
      border border-primary-200/30
      shadow-[0_8px_32px_rgba(102,126,234,0.2)]
      hover:shadow-[0_16px_48px_rgba(102,126,234,0.3)]
      hover:-translate-y-1
    `,
  };

  const animationClass = animate ? "animate-slide-up" : "";

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${animationClass} ${className}`}>
      {children}
    </div>
  );
}
