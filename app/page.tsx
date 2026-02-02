"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useState } from "react";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 md:py-32 lg:py-40">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-medium tracking-tight text-gray-900 md:text-6xl lg:text-7xl leading-tight">
            Plan, track, and stay in control of your student finances
          </h1>
          <p className="mt-6 text-lg text-gray-600 md:text-xl leading-relaxed">
            AI-powered semester budgeting that answers "can I afford this?" with smart tradeoff analysis and personalized coaching for college students.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 items-center">
            <Button variant="primary" href="/onboarding">
              Get started
            </Button>
            <a 
              href="#how-it-works" 
              className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors inline-flex items-center gap-1"
            >
              Learn more
              <span className="text-xs">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 md:py-32">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-medium tracking-tight text-gray-900 md:text-4xl">
              Financial clarity for students
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to stay on track this semester.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <h3 className="text-base font-medium text-gray-900">
                Smart semester planning
              </h3>
              <p className="mt-3 text-base text-gray-600 leading-relaxed">
                Builds a plan to stretch your financial aid, loan disbursements, 
                and student worker income across the entire semester. Know exactly 
                how much you have each month.
              </p>
            </Card>
            <Card>
              <h3 className="text-base font-medium text-gray-900">
                "Can I afford this?" answers
              </h3>
              <p className="mt-3 text-base text-gray-600 leading-relaxed">
                Get real tradeoff analysis, not just yes/no. See how purchases 
                impact your runway and discover opportunities to earn extra cash 
                when you need it.
              </p>
            </Card>
            <Card>
              <h3 className="text-base font-medium text-gray-900">
                Proactive support
              </h3>
              <p className="mt-3 text-base text-gray-600 leading-relaxed">
                Receive timely reminders, overspend alerts, and personalized 
                suggestions for side gigs and scholarships you should apply to.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 md:py-32">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-medium tracking-tight text-gray-900 md:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Simple setup, powerful insights.
            </p>
          </div>
          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            <div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent font-medium">
                1
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">
                Set up your semester
              </h3>
              <p className="mt-3 text-base text-gray-600 leading-relaxed">
                Tell us about your financial aid, income, and planned expenses. 
                Takes just a few minutes.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent font-medium">
                2
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">
                Track your spending
              </h3>
              <p className="mt-3 text-base text-gray-600 leading-relaxed">
                Import transactions or log purchases manually. MyFO categorizes 
                and tracks everything automatically.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent font-medium">
                3
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">
                Stay on track
              </h3>
              <p className="mt-3 text-base text-gray-600 leading-relaxed">
                Ask questions, get alerts, and receive personalized financial 
                coaching powered by AI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 md:py-32">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-medium tracking-tight text-gray-900 md:text-4xl">
              FAQ
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Common questions from students.
            </p>
          </div>
          <div className="mt-16 max-w-3xl">
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
                className="border-b border-gray-200 last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between py-6 text-left text-base font-medium text-gray-900 transition-colors duration-150 hover:text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-answer-${i}`}
                  id={`faq-question-${i}`}
                >
                  {item.q}
                  <span
                    className={`ml-2 inline-block text-xs transition-transform duration-200 ${
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
                    openFaq === i ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="pb-6 text-base text-gray-600 leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 md:py-32">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-medium tracking-tight text-gray-900 md:text-4xl">
              Ready to take control of your finances?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start planning your semester budget today. Free to use.
            </p>
            <Button variant="primary" href="/onboarding" className="mt-8">
              Get started
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
