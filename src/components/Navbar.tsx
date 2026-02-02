"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Dashboard", end: true },
  { href: "/transactions", label: "Transactions", end: false },
  { href: "/assistant", label: "Ask MyFO", end: false },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">MyFO</span>
          </Link>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {navLinks.map(({ href, label, end }) => {
              const isActive = pathname
                ? end
                  ? pathname === href
                  : pathname.startsWith(href)
                : false;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "text-foreground underline decoration-foreground/30 underline-offset-4"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
