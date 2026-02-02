"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "./ui/Button";
import Logo from "./Logo";

const navLinks = [
  { href: "/", label: "Home", end: true },
  { href: "/about", label: "About", end: false },
  { href: "/contact", label: "Contact", end: false },
  { href: "/product", label: "Product", end: false },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Logo />
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
            <div className="ml-4 flex items-center gap-3">
              <Button variant="ghost">Sign in</Button>
              <Button variant="primary" href="/product">
                Get started
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
