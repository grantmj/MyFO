import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: string;
  isBot: boolean;
  showTyping?: boolean;
}

export function ChatMessage({ message, isBot, showTyping = false }: ChatMessageProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(showTyping);

  useEffect(() => {
    // If it's a user message, show immediately
    if (!isBot) {
      setDisplayedText(message);
      setIsTyping(false);
      return;
    }

    // If typing effect is disabled, show immediately
    if (!showTyping) {
      setDisplayedText(message);
      setIsTyping(false);
      return;
    }

    let currentIndex = 0;
    setDisplayedText('');
    setIsTyping(true);

    const typingInterval = setInterval(() => {
      // Speed adjustments: faster for long messages
      const speed = message.length > 200 ? 5 : 20;
      const step = message.length > 500 ? 3 : 1; 

      if (currentIndex < message.length) {
        setDisplayedText(message.substring(0, currentIndex + step));
        currentIndex += step;
      } else {
        setDisplayedText(message); // Ensure full text at end
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 20);

    return () => clearInterval(typingInterval);
  }, [message, showTyping, isBot]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isBot ? 'flex-start' : 'flex-end',
        marginBottom: '1rem',
        animation: 'fadeIn 0.3s ease-in',
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '0.875rem 1rem',
          borderRadius: isBot ? '0.75rem 0.75rem 0.75rem 0.25rem' : '0.75rem 0.75rem 0.25rem 0.75rem',
          background: isBot ? '#f3f4f6' : '#76B89F',
          border: 'none',
          color: isBot ? '#111827' : '#ffffff',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div className="markdown-content">
          {isBot ? (
            <ReactMarkdown>
              {displayedText || message}
            </ReactMarkdown>
          ) : (
            displayedText || message
          )}
        </div>
        
        {isTyping && (
          <span
            style={{
              display: 'inline-block',
              width: '0.5rem',
              height: '1rem',
              marginLeft: '0.25rem',
              background: '#111827',
              animation: 'blink 1s infinite',
            }}
          />
        )}
      </div>
      <style jsx global>{`
        .markdown-content p {
          margin: 0 0 0.5rem 0;
        }
        .markdown-content p:last-child {
          margin: 0;
        }
        .markdown-content ul {
          list-style-type: disc !important;
          padding-left: 1rem;
          list-style-position: inside;
        }
        .markdown-content ol {
          list-style-type: decimal !important;
          padding-left: 1rem;
          list-style-position: inside;
        }
        .markdown-content li {
          margin-bottom: 0.25rem;
        }
        .markdown-content strong {
          font-weight: 700;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
