"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

  useEffect(() => {
    initializePage();
  }, []);

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

  const cardStyle: React.CSSProperties = {
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '1rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #f3f4f6',
    marginBottom: '1rem'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Ask MyFO
          </h1>
          <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
            Your personal financial copilot - ask me anything about your budget
          </p>
        </div>

        {configError && (
          <div style={{ ...cardStyle, backgroundColor: '#fefce8', border: '1px solid #fde047' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                  OpenAI API Key Required
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  To use the MyFO chat assistant, you need to add your OpenAI API key to the <code style={{ backgroundColor: '#fef3c7', padding: '0 0.25rem', borderRadius: '0.25rem' }}>.env</code> file:
                </p>
                <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', backgroundColor: '#fef3c7', padding: '0.5rem', borderRadius: '0.25rem', overflowX: 'auto' }}>
                  OPENAI_API_KEY=sk-your-key-here
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div style={{ ...cardStyle, height: '500px', display: 'flex', flexDirection: 'column' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start' }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: message.role === 'user' ? '#76B89F' : '#f3f4f6',
                    color: message.role === 'user' ? 'white' : '#111827'
                  }}
                >
                  <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', margin: 0 }}>{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ backgroundColor: '#f3f4f6', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Thinking...</p>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ borderTop: '1px solid #e5e7eb', padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your budget..."
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#111827',
                  backgroundColor: 'white',
                  outline: 'none'
                }}
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.5rem',
                  background: '#76B89F',
                  color: 'white',
                  fontWeight: 600,
                  border: 'none',
                  cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                  opacity: (!input.trim() || loading) ? 0.5 : 1,
                  fontSize: '0.875rem'
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Quick Questions */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>Quick Questions</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => askQuickQuestion(question)}
                style={{
                  fontSize: '0.875rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#f3f4f6',
                  color: '#111827',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            ⚠️ MyFO is a budgeting tool, not a financial advisor. Recommendations are for educational purposes only.
            All calculations are deterministic based on your input data. Always make final decisions based on your own judgment.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', border: '4px solid #e5e7eb', borderTopColor: '#76B89F', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#4b5563', fontWeight: 500 }}>Loading chat...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <AssistantContent />
    </Suspense>
  );
}
