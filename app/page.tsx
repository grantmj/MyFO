"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [chatInput, setChatInput] = useState("");
  const router = useRouter();

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      router.push(`/assistant?q=${encodeURIComponent(chatInput)}`);
    } else {
      router.push("/assistant");
    }
  };

  return (
    <div>
      {/* Hero with Chatbot Widget */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div
            className="relative rounded-[3rem] overflow-hidden"
            style={{
              backgroundImage: 'url(/campus-background.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />

            <div className="relative z-10 px-8 py-24 sm:px-12 lg:px-16 md:py-32 lg:py-40">
              <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
                {/* Left side - Content */}
                <div>
                  <h1 className="text-5xl font-medium tracking-tight text-gray-900 md:text-6xl lg:text-7xl leading-tight drop-shadow-sm">
                    Plan, track, and stay in control of your student finances
                  </h1>
                  <p className="mt-6 text-lg md:text-xl text-gray-900 leading-relaxed drop-shadow-sm">
                    AI-powered semester budgeting that answers "can I afford this?" with smart tradeoff analysis and personalized coaching for college students.
                  </p>
                  <div className="mt-8">
                    <Button variant="primary" href="/register">
                      Get started
                    </Button>
                  </div>
                </div>

                {/* Right side - Chatbot Widget with Glassmorphism */}
                <div className="lg:ml-auto lg:max-w-lg w-full">
                  <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/50 p-8 shadow-xl">
                    <div className="mb-6">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-accent text-sm font-medium">M</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-base text-gray-900 font-medium">MyFO Assistant</p>
                          <p className="mt-2 text-sm text-gray-800 leading-relaxed">
                            What finances do you need help with today?
                          </p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleChatSubmit} className="space-y-4">
                      <div>
                        <textarea
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask about budgeting, spending, or any financial question..."
                          rows={4}
                          className="w-full rounded-lg border border-white/60 bg-white/60 backdrop-blur-sm px-4 py-3 text-sm text-gray-900 placeholder:text-gray-600 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 shadow-lg"
                      >
                        Get answers →
                      </button>
                    </form>

                    <p className="mt-4 text-xs text-gray-700 text-center">
                      Try the interactive demo
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
                    className={`ml-2 inline-block text-xs transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""
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
                  className={`overflow-hidden transition-all duration-200 ${openFaq === i ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
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
