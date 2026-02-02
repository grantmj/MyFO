import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8 md:py-32">
      <div className="max-w-xl">
        <p className="text-sm font-medium text-accent">404</p>
        <h1 className="mt-2 text-4xl font-medium tracking-tight text-foreground md:text-5xl">
          Page not found
        </h1>
        <p className="mt-4 text-base text-muted md:text-lg leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-md border border-border bg-white px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-surface hover:border-accent/50"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
