import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { useState } from "react";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 md:py-24">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Build faster, ship sooner
          </h1>
          <p className="mt-4 text-base text-muted md:text-lg leading-relaxed">
            A simple toolkit for teams who want to move quickly without the
            overhead. Fast setup, clean UI, built for iteration.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button variant="primary" to="/contact">
              Get started
            </Button>
            <Button variant="secondary" to="/about">
              Learn more
            </Button>
          </div>
        </div>
      </section>

      {/* Features - 3–4 items, asymmetric layout */}
      <section className="border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 md:py-24">
          <div className="max-w-xl">
            <h2 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              What you get
            </h2>
            <p className="mt-2 text-base text-muted">
              Focused on the essentials. No bloat.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <h3 className="text-sm font-medium text-foreground">
                Fast setup
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Get running in minutes. No complex config or lengthy onboarding.
              </p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-foreground">
                Simple integrations
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Connect the tools you already use. APIs and webhooks included.
              </p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-foreground">Clean UI</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Straightforward interface. No clutter, no learning curve.
              </p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-foreground">
                Built for iteration
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Change things as you go. Designed for early-stage teams.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing - 2 tiers */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 md:py-24">
          <div className="max-w-xl">
            <h2 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              Simple pricing
            </h2>
            <p className="mt-2 text-base text-muted">
              Two plans. No hidden fees.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:max-w-3xl">
            <Card className="border-foreground/10">
              <Badge>Starter</Badge>
              <p className="mt-4 text-3xl font-medium text-foreground">$0</p>
              <p className="mt-1 text-sm text-muted">Free forever</p>
              <p className="mt-4 text-sm text-muted leading-relaxed">
                Core features for small teams. Up to 3 members, basic support.
              </p>
              <Button variant="secondary" className="mt-6 w-full">
                Start free
              </Button>
            </Card>
            <Card className="border-accent/30">
              <Badge>Pro</Badge>
              <p className="mt-4 text-3xl font-medium text-foreground">$29</p>
              <p className="mt-1 text-sm text-muted">Per month</p>
              <p className="mt-4 text-sm text-muted leading-relaxed">
                Unlimited members, priority support, advanced integrations.
              </p>
              <Button variant="primary" className="mt-6 w-full">
                Get Pro
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ - 4 questions, accordion */}
      <section className="border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 md:py-24">
          <div className="max-w-xl">
            <h2 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              FAQ
            </h2>
            <p className="mt-2 text-base text-muted">
              Common questions.
            </p>
          </div>
          <div className="mt-12 max-w-2xl">
            {[
              {
                q: "How do I get started?",
                a: "Sign up with your email. You can start using the free tier immediately. No credit card required.",
              },
              {
                q: "Can I change plans later?",
                a: "Yes. Upgrade or downgrade anytime. We prorate the difference.",
              },
              {
                q: "What kind of support do you offer?",
                a: "Free tier includes email support. Pro gets priority response and optional Slack connect.",
              },
              {
                q: "Is there an API?",
                a: "Yes. REST API and webhooks are available on all plans. Docs are in the dashboard.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="border-b border-border last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-foreground transition-colors duration-150 hover:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-answer-${i}`}
                  id={`faq-question-${i}`}
                >
                  {item.q}
                  <span
                    className={`ml-2 inline-block text-[10px] transition-transform duration-200 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  >
                    ▾
                  </span>
                </button>
                <div
                  id={`faq-answer-${i}`}
                  role="region"
                  aria-labelledby={`faq-question-${i}`}
                  className={`overflow-hidden transition-all duration-200 ${
                    openFaq === i ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="pb-4 text-sm text-muted leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - minimal, realistic */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 md:py-24">
          <div className="max-w-xl">
            <h2 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              What people say
            </h2>
            <p className="mt-2 text-base text-muted">
              From teams like yours.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <Card>
              <p className="text-sm text-foreground leading-relaxed">
                &ldquo;We were up and running in an afternoon. Exactly what we
                needed.&rdquo;
              </p>
              <p className="mt-4 text-sm text-muted">Sarah, eng lead</p>
            </Card>
            <Card>
              <p className="text-sm text-foreground leading-relaxed">
                &ldquo;Clean and simple. No fluff. That&apos;s rare.&rdquo;
              </p>
              <p className="mt-4 text-sm text-muted">Marcus, founder</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 md:py-24">
          <div className="max-w-xl">
            <h2 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              Ready to try it?
            </h2>
            <p className="mt-2 text-base text-muted">
              Start free. No credit card required.
            </p>
            <Button variant="primary" to="/contact" className="mt-6">
              Get started
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
