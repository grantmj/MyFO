"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function AssistantContent() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [configError, setConfigError] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializePage();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function initializePage() {
    try {
      const userRes = await fetch('/api/user');
      const { user } = await userRes.json();
      setUserId(user.id);

      // Add welcome message
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm MyFo, your financial copilot. Ask me questions like:\n\n• Can I afford to buy a $90 concert ticket?\n• How am I doing on my budget?\n• What should I cut back on?\n• Can I take a trip that costs $400?\n\nI'll give you honest answers based on your actual budget, not guesses!",
        },
      ]);

      setIsInitialized(true);

      // Check if there's a query parameter from the homepage
      const query = searchParams.get('q');
      if (query) {
        setInput(query);
        // Auto-send the message after a brief delay to let the user see it
        setTimeout(() => {
          sendMessageWithContent(query, user.id);
        }, 500);
      }
    } catch (error) {
      console.error('Error initializing page:', error);
      showToast('Failed to initialize chat', 'error');
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function sendMessageWithContent(messageContent: string, userIdToUse: string) {
    if (!messageContent.trim() || !userIdToUse || loading) return;

    const userMessage = messageContent.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setConfigError(false);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdToUse,
          message: userMessage,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isConfigError) {
          setConfigError(true);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `⚠️ ${data.error}\n\nPlease add your OpenAI API key to the .env file to use the chat feature.`,
          }]);
        } else if (data.needsOnboarding) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: "It looks like you haven't completed your budget setup yet. Please complete the onboarding wizard first!",
          }]);
        } else {
          showToast('Failed to get response', 'error');
        }
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!userId) return;
    sendMessageWithContent(input, userId);
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const quickQuestions = [
    "Can I afford a $90 concert ticket?",
    "How am I doing on my budget?",
    "What category am I spending most on?",
    "Can I take a $400 spring break trip?",
  ];

  function askQuickQuestion(question: string) {
    setInput(question);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-foreground">Ask MyFo</h1>
          <p className="mt-1 text-sm text-muted">
            Your personal financial copilot - ask me anything about your budget
          </p>
        </div>

        {configError && (
          <Card className="mb-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">
                  OpenAI API Key Required
                </h3>
                <p className="text-xs text-muted">
                  To use the MyFo chat assistant, you need to add your OpenAI API key to the <code className="bg-yellow-100 px-1 rounded">.env</code> file:
                </p>
                <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded overflow-x-auto">
                  OPENAI_API_KEY=sk-your-key-here
                </pre>
              </div>
            </div>
          </Card>
        )}

        {/* Chat Container */}
        <Card className="mb-4 h-[500px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === 'user'
                      ? 'bg-accent text-white'
                      : 'bg-gray-100 text-foreground'
                    }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <p className="text-sm text-muted">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your budget..."
                className="flex-1 px-3 py-2 border border-border rounded-md text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={loading}
              />
              <Button
                variant="primary"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
              >
                Send
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Questions */}
        <Card>
          <h3 className="text-sm font-medium text-foreground mb-3">Quick Questions</h3>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => askQuickQuestion(question)}
                className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 text-foreground rounded-md transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </Card>

        {/* Disclaimer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted">
            ⚠️ MyFo is a budgeting tool, not a financial advisor. Recommendations are for educational purposes only.
            All calculations are deterministic based on your input data. Always make final decisions based on your own judgment.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <AssistantContent />
    </Suspense>
  );
}
