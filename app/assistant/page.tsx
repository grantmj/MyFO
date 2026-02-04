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

      // Restore saved conversation or show welcome message
      let restoredMessages: Message[] = [];
      try {
        const saved = localStorage.getItem('myfo_chat_messages');
        if (saved) {
          restoredMessages = JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Could not restore chat from localStorage');
      }

      if (restoredMessages.length > 0) {
        setMessages(restoredMessages);
      } else {
        // Add welcome message
        setMessages([
          {
            role: 'assistant',
            content: "Hi! I'm MyFo, your financial copilot. Ask me questions like:\n\n• Can I afford to buy a $90 concert ticket?\n• How am I doing on my budget?\n• What should I cut back on?\n• Can I take a trip that costs $400?\n\nI'll give you honest answers based on your actual budget, not guesses!",
          },
        ]);
      }

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
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
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

      // Handle successful response
      const finalMessages = [...newMessages, { role: 'assistant' as const, content: data.reply }];
      setMessages(finalMessages);

      // Save conversation to localStorage for persistence
      try {
        localStorage.setItem('myfo_chat_messages', JSON.stringify(finalMessages));
      } catch (e) {
        console.warn('Could not save chat to localStorage');
      }

      // Handle database updates - show notification and signal refresh needed
      if (data.updates && data.updates.length > 0) {
        // Set a flag that dashboard should refresh
        localStorage.setItem('myfo_data_updated', Date.now().toString());

        // Show a toast about what was updated
        const updateSummary = data.updates.join(', ');
        showToast(`✅ Updated: ${updateSummary}`, 'success');
      }
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

  function clearChat() {
    const welcomeMessage: Message = {
      role: 'assistant',
      content: "Hi! I'm MyFo, your financial copilot. Ask me questions like:\n\n• Can I afford to buy a $90 concert ticket?\n• How am I doing on my budget?\n• What should I cut back on?\n• Can I take a trip that costs $400?\n\nI'll give you honest answers based on your actual budget, not guesses!",
    };
    setMessages([welcomeMessage]);
    try {
      localStorage.removeItem('myfo_chat_messages');
    } catch (e) {
      console.warn('Could not clear chat from localStorage');
    }
    showToast('Chat cleared', 'success');
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
      <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .page-container {
                    animation: fadeIn 0.4s ease-out;
                }
                .header-section {
                    animation: fadeInUp 0.5s ease-out;
                }
                .card-animate {
                    animation: scaleIn 0.5s ease-out;
                }
                .btn-primary {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(118, 184, 159, 0.35);
                }
                .btn-primary:active {
                    transform: translateY(0) scale(0.98);
                }
                .btn-secondary {
                    transition: all 0.2s ease;
                }
                .btn-secondary:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .btn-secondary:active {
                    transform: scale(0.95);
                }
                .message-user {
                    animation: slideInRight 0.3s ease-out;
                }
                .message-assistant {
                    animation: slideInLeft 0.3s ease-out;
                }
                .quick-question-btn {
                    transition: all 0.2s ease;
                }
                .quick-question-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .badge {
                    transition: all 0.2s ease;
                }
                .badge:hover {
                    transform: scale(1.1);
                }
            `}</style>
      <div className="page-container" style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1rem' }}>
        <div className="header-section" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              Ask MyFo
            </h1>
            <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
              Your personal financial copilot - ask me anything about your budget
            </p>
          </div>
          <button
            onClick={clearChat}
            className="btn-secondary"
            style={{
              fontSize: '0.75rem',
              padding: '0.375rem 0.75rem',
              color: '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              background: 'transparent',
              cursor: 'pointer'
            }}
          >
            Clear Chat
          </button>
        </div>

        {configError && (
          <div className="card-animate" style={{ ...cardStyle, backgroundColor: '#fefce8', border: '1px solid #fde047' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                  OpenAI API Key Required
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  To use the MyFo chat assistant, you need to add your OpenAI API key to the <code style={{ backgroundColor: '#fef3c7', padding: '0 0.25rem', borderRadius: '0.25rem' }}>.env</code> file:
                </p>
                <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', backgroundColor: '#fef3c7', padding: '0.5rem', borderRadius: '0.25rem', overflowX: 'auto' }}>
                  OPENAI_API_KEY=sk-your-key-here
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div className="card-animate" style={{ ...cardStyle, height: '500px', display: 'flex', flexDirection: 'column' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={message.role === 'user' ? 'message-user' : 'message-assistant'}
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
                className="btn-primary"
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
        <div className="card-animate" style={cardStyle}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>Quick Questions</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => askQuickQuestion(question)}
                className="quick-question-btn"
                style={{
                  fontSize: '0.875rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#f3f4f6',
                  color: '#111827',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer'
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
