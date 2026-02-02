import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted">
            © {currentYear} PIA Hackathon. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              to="/"
              className="text-sm text-muted transition-colors duration-150 hover:text-foreground"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="text-sm text-muted transition-colors duration-150 hover:text-foreground"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-sm text-muted transition-colors duration-150 hover:text-foreground"
            >
              Contact
            </Link>
            <Link
              to="/product"
              className="text-sm text-muted transition-colors duration-150 hover:text-foreground"
            >
              Product
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
