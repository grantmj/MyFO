import { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  type?: 'text' | 'number';
}

export function ChatInput({ onSubmit, disabled = false, placeholder = 'Type your answer...', type = 'text' }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <>
      <div style={{ position: 'relative', flex: 1 }}>
        {type === 'number' && (
          <span
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            $
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: type === 'number' ? '0.875rem 1rem 0.875rem 1.75rem' : '0.875rem 1rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            fontSize: '0.875rem',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box',
            color: '#111827',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#76B89F')}
          onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        style={{
          padding: '0.875rem 1.5rem',
          borderRadius: '0.5rem',
          border: 'none',
          background: disabled || !value.trim() ? '#e5e7eb' : '#76B89F',
          color: 'white',
          fontWeight: 600,
          cursor: disabled || !value.trim() ? 'default' : 'pointer',
          fontSize: '0.875rem',
          transition: 'all 0.2s',
        }}
      >
        Send
      </button>
    </>
  );
}
