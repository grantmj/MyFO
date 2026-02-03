"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/income", label: "Income" },
  { href: "/transactions", label: "Transactions" },
  { href: "/assistant", label: "Ask MyFO" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  // Hide navbar on auth pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">MyFO</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-1">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                            ? "bg-accent text-white"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                  <span className="text-sm text-gray-500 hidden sm:block">
                    {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              !loading && (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-md px-4 py-2 text-sm font-medium bg-accent text-white hover:bg-accent/90 transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
