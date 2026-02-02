"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useState } from "react";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 md:py-24">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Your student financial health copilot
          </h1>
          <p className="mt-4 text-base text-muted md:text-lg leading-relaxed">
            MyFO helps college students plan semester budgets, track spending, 
            and answer "can I afford this?" with smart tradeoff analysis and AI coaching. 
            Like a Ramp-style spend policy layer, but for your real life.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button variant="primary" href="/onboarding">
              Get started
            </Button>
            <Button variant="secondary" href="/dashboard">
              View demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 md:py-24">
          <div className="max-w-xl">
            <h2 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              Financial clarity for students
            </h2>
            <p className="mt-2 text-base text-muted">
              Everything you need to stay on track this semester.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <h3 className="text-sm font-medium text-foreground">
                Smart semester planning
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Builds a plan to stretch your financial aid, loan disbursements, 
                and student worker income across the entire semester. Know exactly 
                how much you have each month.
              </p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-foreground">
                "Can I afford this?" answers
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Get real tradeoff analysis, not just yes/no. See how purchases 
                impact your runway and discover opportunities to earn extra cash 
                when you need it.
              </p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-foreground">
                Proactive support
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Receive timely reminders, overspend alerts, and personalized 
                suggestions for side gigs and scholarships you should apply to.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 md:py-24">
          <div className="max-w-xl">
            <h2 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              How it works
            </h2>
            <p className="mt-2 text-base text-muted">
              Simple setup, powerful insights.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent font-medium text-sm">
                1
              </div>
              <h3 className="mt-4 text-sm font-medium text-foreground">
                Set up your semester
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Tell us about your financial aid, income, and planned expenses. 
                Takes just a few minutes.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent font-medium text-sm">
                2
              </div>
              <h3 className="mt-4 text-sm font-medium text-foreground">
                Track your spending
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Import transactions or log purchases manually. MyFO categorizes 
                and tracks everything automatically.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent font-medium text-sm">
                3
              </div>
              <h3 className="mt-4 text-sm font-medium text-foreground">
                Stay on track
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Ask questions, get alerts, and receive personalized financial 
                coaching powered by AI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 md:py-24">
          <div className="max-w-xl">
            <h2 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              FAQ
            </h2>
            <p className="mt-2 text-base text-muted">
              Common questions from students.
            </p>
          </div>
          <div className="mt-12 max-w-2xl">
            {[
              {
                q: "How does MyFO help me budget my semester?",
                a: "MyFO takes your financial aid disbursements, student worker income, and planned expenses to create a week-by-week spending plan. You'll always know your 'safe to spend' amount and when your money might run out.",
              },
              {
                q: "What does 'can I afford this?' actually show me?",
                a: "Instead of just yes or no, MyFO shows you the tradeoffs. You'll see how a purchase impacts your runway, what you might need to cut back on, or ways to earn extra to cover it without stress.",
              },
              {
                q: "Is my financial information secure?",
                a: "Absolutely. We use bank-level encryption and never sell your data. Your financial information is private and protected.",
              },
              {
                q: "How do I import my transactions?",
                a: "You can upload a CSV from your bank or manually log purchases. MyFO automatically categorizes transactions and updates your budget in real-time.",
              },
              {
                q: "What kind of proactive help does MyFO provide?",
                a: "MyFO sends reminders for planned expenses, alerts you when you're overspending in a category, and suggests relevant scholarships or side gigs when you need extra income.",
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

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 md:py-24">
          <div className="max-w-xl">
            <h2 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              Ready to take control of your finances?
            </h2>
            <p className="mt-2 text-base text-muted">
              Start planning your semester budget today. Free to use.
            </p>
            <Button variant="primary" href="/onboarding" className="mt-6">
              Get started
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
