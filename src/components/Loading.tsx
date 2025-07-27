import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text = 'Loading...',
  className = '',
}) => {
  const sizeStyles = {
    sm: { width: '1rem', height: '1rem' },
    md: { width: '2rem', height: '2rem' },
    lg: { width: '3rem', height: '3rem' },
  };

  const textSizeStyles = {
    sm: { fontSize: '0.875rem' },
    md: { fontSize: '1rem' },
    lg: { fontSize: '1.125rem' },
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div style={{
        ...sizeStyles[size],
        animation: 'spin 1s linear infinite',
        borderRadius: '50%',
        border: '4px solid #e5e7eb',
        borderTopColor: '#dc2626'
      }} />
      {text && (
        <p style={{
          marginTop: '0.5rem',
          color: '#6b7280',
          ...textSizeStyles[size]
        }}>
          {text}
        </p>
      )}
    </div>
  );
};

export default Loading; 