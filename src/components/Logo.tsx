import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 transition-opacity duration-150 hover:opacity-80 ${className}`}
      aria-label="MyFo home"
    >
      <svg
        width="36"
        height="40"
        viewBox="0 0 36 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Shield - light mint fill, main green border */}
        <path
          d="M18 2L33 7.5V19.5C33 27 25.5 32.5 18 36.5C10.5 32.5 3 27 3 19.5V7.5L18 2Z"
          stroke="#76B89F"
          strokeWidth="1.5"
          fill="#C7E0D3"
        />
        {/* Graduation cap - white fill */}
        <path
          d="M11.5 15.5L18 12.5L24.5 15.5V19L18 22L11.5 19V15.5Z"
          fill="white"
          stroke="#76B89F"
          strokeWidth="0.6"
        />
        <path
          d="M18 12.5V9.5M18 9.5L21.5 11M18 9.5L14.5 11"
          stroke="#76B89F"
          strokeWidth="0.6"
          strokeLinecap="round"
        />
        <circle cx="21.5" cy="11" r="0.8" fill="#76B89F" />
        {/* Leaf with dollar - main green */}
        <path
          d="M19.5 21.5C19.5 21.5 23 19.5 26.5 23C26.5 26.5 23 30 19.5 31.5C16 30 12.5 26.5 12.5 23C16 19.5 19.5 21.5 19.5 21.5Z"
          fill="#76B89F"
        />
        <text
          x="19.5"
          y="26.5"
          textAnchor="middle"
          fill="white"
          fontSize="9"
          fontFamily="system-ui, sans-serif"
          fontWeight="700"
        >
          $
        </text>
      </svg>
      <span className="text-lg font-semibold text-foreground">MyFo</span>
    </Link>
  );
}
