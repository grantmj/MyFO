import { Link, NavLink } from "react-router-dom";
import Button from "./ui/Button";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link
            to="/"
            className="text-lg font-semibold text-foreground transition-colors duration-150 hover:text-muted"
          >
            PIA Hackathon
          </Link>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "text-foreground underline decoration-foreground/30 underline-offset-4"
                    : "text-muted hover:text-foreground"
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "text-foreground underline decoration-foreground/30 underline-offset-4"
                    : "text-muted hover:text-foreground"
                }`
              }
            >
              About
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "text-foreground underline decoration-foreground/30 underline-offset-4"
                    : "text-muted hover:text-foreground"
                }`
              }
            >
              Contact
            </NavLink>
            <NavLink
              to="/product"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "text-foreground underline decoration-foreground/30 underline-offset-4"
                    : "text-muted hover:text-foreground"
                }`
              }
            >
              Product
            </NavLink>
            <div className="ml-4 flex items-center gap-3">
              <Button variant="ghost">Sign in</Button>
              <Button variant="primary" to="/product">
                Get started
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
