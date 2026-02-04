"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { ChatMessage } from "@/components/ui/ChatMessage";

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
            content: "Hi! I'm MyFo, your financial copilot. Ask me questions like:\n\n- Can I afford to buy a $90 concert ticket?\n- How am I doing on my budget?\n- What should I cut back on?\n- Can I take a trip that costs $400?\n\nI'll give you honest answers based on your actual budget, not guesses!",
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

  // Auto-scroll within chat messages container only
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

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
            content: "Hi! I'm MyFo, your financial copilot. Ask me questions like:\n\n- Can I afford to buy a $90 concert ticket?\n- How am I doing on my budget?\n- What should I cut back on?\n- Can I take a trip that costs $400?\n\nI'll give you honest answers based on your actual budget, not guesses!",
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
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .message-user {
          animation: slideInRight 0.3s ease-out;
        }
        .message-assistant {
          animation: slideInLeft 0.3s ease-out;
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '2rem 1rem',
        borderBottom: '1px solid #e5e7eb',
        background: 'white',
      }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              Ask MyFO
            </h1>
            <p style={{ marginTop: '0.5rem', color: '#6b7280', fontSize: '1rem' }}>
              Your personal financial copilot
            </p>
          </div>
          <button
            onClick={clearChat}
            style={{
              fontSize: '0.875rem',
              padding: '0.5rem 1rem',
              color: '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              background: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#76B89F';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div style={{
        flex: 1,
        maxWidth: '56rem',
        width: '100%',
        margin: '0 auto',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}>
        {configError && (
          <div style={{
            backgroundColor: '#fefce8',
            border: '1px solid #fde047',
            borderRadius: '1rem',
            padding: '1rem',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                  OpenAI API Key Required
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  To use the MyFO chat assistant, you need to add your OpenAI API key to the <code style={{ backgroundColor: '#fef3c7', padding: '0 0.25rem', borderRadius: '0.25rem' }}>.env</code> file.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #f3f4f6',
          display: 'flex',
          flexDirection: 'column',
          height: '500px',
          maxHeight: '60vh',
          marginBottom: '1rem',
        }}>
          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                message={message.content}
                isBot={message.role === 'assistant'}
                showTyping={index === messages.length - 1 && message.role === 'assistant'}
              />
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.75rem 0.75rem 0.75rem 0.25rem',
                  padding: '0.875rem 1rem',
                  display: 'flex',
                  gap: '0.375rem',
                  alignItems: 'center',
                }}>
                  <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#6b7280', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0s' }} />
                  <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#6b7280', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }} />
                  <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#6b7280', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{
            borderTop: '1px solid #e5e7eb',
            padding: '1rem',
            display: 'flex',
            gap: '0.75rem',
          }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your budget..."
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#111827',
                  backgroundColor: 'white',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#76B89F')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                disabled={loading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                padding: '0.875rem 1.5rem',
                borderRadius: '0.5rem',
                background: (!input.trim() || loading) ? '#e5e7eb' : '#76B89F',
                color: 'white',
                fontWeight: 600,
                border: 'none',
                cursor: (!input.trim() || loading) ? 'default' : 'pointer',
                fontSize: '0.875rem',
                transition: 'all 0.2s',
              }}
            >
              Send
            </button>
          </div>
        </div>

        {/* Quick Questions */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #f3f4f6',
          padding: '1.5rem',
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem', marginTop: 0 }}>Quick Questions</h3>
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
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
            ⚠️ MyFO is a budgeting tool, not a financial advisor. Recommendations are for educational purposes only.
          </p>
        </div>
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
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
