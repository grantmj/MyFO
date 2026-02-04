export function TypingIndicator() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          padding: '0.875rem 1rem',
          borderRadius: '0.75rem 0.75rem 0.75rem 0.25rem',
          background: '#f3f4f6',
          border: 'none',
          display: 'flex',
          gap: '0.375rem',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '0.5rem',
            height: '0.5rem',
            borderRadius: '50%',
            background: '#6b7280',
            animation: 'bounce 1.4s infinite ease-in-out both',
            animationDelay: '0s',
          }}
        />
        <div
          style={{
            width: '0.5rem',
            height: '0.5rem',
            borderRadius: '50%',
            background: '#6b7280',
            animation: 'bounce 1.4s infinite ease-in-out both',
            animationDelay: '0.2s',
          }}
        />
        <div
          style={{
            width: '0.5rem',
            height: '0.5rem',
            borderRadius: '50%',
            background: '#6b7280',
            animation: 'bounce 1.4s infinite ease-in-out both',
            animationDelay: '0.4s',
          }}
        />
      </div>
      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
