"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Dashboard", end: true },
  { href: "/income", label: "Income", end: false },
  { href: "/transactions", label: "Transactions", end: false },
  { href: "/assistant", label: "Ask MyFO", end: false },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', height: '4rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo section */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(16, 185, 129, 0.25)'
            }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 36 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 2L33 7.5V19.5C33 27 25.5 32.5 18 36.5C10.5 32.5 3 27 3 19.5V7.5L18 2Z"
                  stroke="white"
                  strokeWidth="2"
                  fill="rgba(255,255,255,0.2)"
                />
                <text
                  x="18"
                  y="24"
                  textAnchor="middle"
                  fill="white"
                  fontSize="16"
                  fontFamily="system-ui, sans-serif"
                  fontWeight="700"
                >
                  $
                </text>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>MyFO</span>
              <span style={{ fontSize: '10px', color: '#6b7280', marginTop: '-2px' }}>My Financial Officer</span>
            </div>
          </Link>

          {/* Navigation links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    ...(isActive ? {
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: 'white',
                      boxShadow: '0 4px 6px rgba(99, 102, 241, 0.25)'
                    } : {
                      color: '#4b5563',
                      backgroundColor: 'transparent'
                    })
                  }}
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
