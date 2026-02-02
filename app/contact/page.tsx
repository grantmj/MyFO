import Button from "@/components/ui/Button";

export default function Contact() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 md:py-24">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-medium tracking-tight text-foreground md:text-5xl">
          Get in touch
        </h1>
        <p className="mt-4 text-base text-muted md:text-lg leading-relaxed">
          Have a question or want to learn more? Send us a note and we&apos;ll
          get back to you.
        </p>
        <form className="mt-10 space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="mt-2 block w-full rounded-md border border-border bg-white px-4 py-2.5 text-foreground shadow-sm transition-colors duration-150 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:ring-offset-0"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-foreground"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              className="mt-2 block w-full rounded-md border border-border bg-white px-4 py-2.5 text-foreground shadow-sm transition-colors duration-150 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:ring-offset-0"
              placeholder="What's on your mind?"
            />
          </div>
          <Button variant="primary" type="submit">
            Send message
          </Button>
        </form>
        <p className="mt-8 text-sm text-muted">
          Prefer email? Reach us at{" "}
          <a
            href="mailto:hello@example.com"
            className="text-accent transition-colors duration-150 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            hello@example.com
          </a>
        </p>
      </div>
    </div>
  );
}
