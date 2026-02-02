"use client";

import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/components/ui/Toast";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistantPage() {
  const { showToast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [configError, setConfigError] = useState(false);
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

      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm **MyFO**, your AI financial copilot.\n\nAsk me anything about your budget:\n\n- \"Can I afford a $90 concert ticket?\"\n- \"How am I doing on my budget?\"\n- \"What should I cut back on?\"\n- \"Can I take a $400 spring break trip?\"\n\nI'll give you honest, math-based answers — no guessing!",
        },
      ]);
    } catch (error) {
      console.error('Error initializing page:', error);
      showToast('Failed to initialize chat', 'error');
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function sendMessage() {
    if (!input.trim() || !userId || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setConfigError(false);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
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
            content: `${data.error}\n\nPlease add your OpenAI API key to the .env file to use the chat feature.`,
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

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const quickQuestions = [
    { text: "Can I afford a $90 concert ticket?" },
    { text: "How am I doing on my budget?" },
    { text: "What category am I spending most on?" },
    { text: "Can I take a $400 spring break trip?" },
  ];

  function askQuickQuestion(question: string) {
    setInput(question);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eef2ff 0%, #ffffff 50%, #faf5ff 100%)' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '5rem',
            height: '5rem',
            borderRadius: '1.5rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
            marginBottom: '1rem'
          }}>
            <svg style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Ask MyFO</h1>
          <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
            Your AI financial copilot — powered by math, not guesses
          </p>
        </div>

        {configError && (
          <div style={{ marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                  OpenAI API Key Required
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.75rem' }}>
                  To use the MyFO chat assistant, add your OpenAI API key to the <code style={{ padding: '0.125rem 0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.25rem', fontSize: '0.875rem' }}>.env</code> file:
                </p>
                <div style={{ backgroundColor: '#1f2937', color: '#f3f4f6', borderRadius: '0.5rem', padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  OPENAI_API_KEY=sk-your-key-here
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div style={{ marginBottom: '1.5rem', backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ height: '500px', overflowY: 'auto', padding: '1.5rem', backgroundColor: '#f9fafb' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
                }}
              >
                {/* Avatar */}
                <div style={{
                  flexShrink: 0,
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: message.role === 'user'
                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)'
                }}>
                  {message.role === 'user' ? (
                    <svg style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ) : (
                    <svg style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>

                {/* Message bubble */}
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '0.75rem 1.25rem',
                    borderRadius: message.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                    ...(message.role === 'user' ? {
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: 'white'
                    } : {
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      color: '#1f2937'
                    })
                  }}
                >
                  {message.role === 'assistant' ? (
                    <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p style={{ margin: '0.5rem 0' }}>{children}</p>,
                          ul: ({ children }) => <ul style={{ margin: '0.5rem 0', paddingLeft: '1.25rem' }}>{children}</ul>,
                          li: ({ children }) => <li style={{ margin: '0.25rem 0' }}>{children}</li>,
                          strong: ({ children }) => <strong style={{ fontWeight: 600, color: '#111827' }}>{children}</strong>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
                      {message.content}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
                <div style={{
                  flexShrink: 0,
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', borderRadius: '1rem 1rem 1rem 0.25rem', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#9ca3af', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.32s' }} />
                    <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#9ca3af', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.16s' }} />
                    <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#9ca3af', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div style={{ borderTop: '1px solid #e5e7eb', backgroundColor: 'white', padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your budget..."
                  style={{
                    width: '100%',
                    padding: '0.875rem 1.25rem',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '1rem',
                    fontSize: '0.875rem',
                    color: '#111827',
                    outline: 'none'
                  }}
                  disabled={loading}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  background: (!input.trim() || loading) ? '#d1d5db' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  fontWeight: 600,
                  border: 'none',
                  cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                  boxShadow: (!input.trim() || loading) ? 'none' : '0 4px 6px rgba(99, 102, 241, 0.25)'
                }}
              >
                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Questions */}
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280', marginBottom: '0.75rem', textAlign: 'center' }}>Quick Questions</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}>
            {quickQuestions.map((q, index) => (
              <button
                key={index}
                onClick={() => askQuickQuestion(q.text)}
                style={{
                  padding: '0.625rem 1rem',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                {q.text}
              </button>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '9999px', backgroundColor: '#f3f4f6', fontSize: '0.75rem', color: '#6b7280' }}>
            <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>All calculations are deterministic · Not financial advice</span>
          </div>
        </div>
      </div>
      <style>{`@keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-8px); } }`}</style>
    </div>
  );
}
