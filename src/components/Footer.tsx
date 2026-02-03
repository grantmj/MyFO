import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="text-sm text-gray-600">
            © {currentYear} MyFO. All rights reserved.
          </p>
          <div className="flex gap-8">
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
              Demo
            </Link>
            <Link
              href="/onboarding"
              className="text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
