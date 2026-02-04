import { useEffect, useState } from 'react';

interface ChatMessageProps {
  message: string;
  isBot: boolean;
  showTyping?: boolean;
}

export function ChatMessage({ message, isBot, showTyping = false }: ChatMessageProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(showTyping);

  useEffect(() => {
    if (!showTyping || !isBot) {
      setDisplayedText(message);
      setIsTyping(false);
      return;
    }

    let currentIndex = 0;
    setDisplayedText('');
    setIsTyping(true);

    const typingInterval = setInterval(() => {
      if (currentIndex < message.length) {
        setDisplayedText(message.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 20); // 20ms per character for smooth typing

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
          maxWidth: '75%',
          padding: '0.875rem 1rem',
          borderRadius: isBot ? '0.75rem 0.75rem 0.75rem 0.25rem' : '0.75rem 0.75rem 0.25rem 0.75rem',
          background: isBot ? '#f3f4f6' : '#76B89F',
          border: 'none',
          color: isBot ? '#111827' : '#ffffff',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        {displayedText || message}
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
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
