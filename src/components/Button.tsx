import React from 'react';
import type { ButtonProps } from '../types';

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  children,
  className = '',
  style,
  type = 'button',
}) => {
  const baseStyles: React.CSSProperties = {
    fontWeight: '600',
    borderRadius: '0.5rem',
    transition: 'all 0.2s',
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    border: 'none',
    display: 'inline-block',
    textDecoration: 'none',
    textAlign: 'center',
    ...style
  };
  
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#dc2626',
      color: 'white',
    },
    secondary: {
      backgroundColor: '#0284c7',
      color: 'white',
    },
    danger: {
      backgroundColor: '#dc2626',
      color: 'white',
    },
    success: {
      backgroundColor: '#16a34a',
      color: 'white',
    },
  };
  
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
    md: { padding: '0.5rem 1rem', fontSize: '1rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' },
  };
  
  const buttonStyles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      const variant = e.currentTarget.getAttribute('data-variant');
      if (variant === 'primary') {
        e.currentTarget.style.backgroundColor = '#b91c1c';
      } else if (variant === 'secondary') {
        e.currentTarget.style.backgroundColor = '#0369a1';
      } else if (variant === 'danger') {
        e.currentTarget.style.backgroundColor = '#b91c1c';
      } else if (variant === 'success') {
        e.currentTarget.style.backgroundColor = '#15803d';
      }
    }
    onMouseEnter?.();
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      const variant = e.currentTarget.getAttribute('data-variant');
      if (variant === 'primary') {
        e.currentTarget.style.backgroundColor = '#dc2626';
      } else if (variant === 'secondary') {
        e.currentTarget.style.backgroundColor = '#0284c7';
      } else if (variant === 'danger') {
        e.currentTarget.style.backgroundColor = '#dc2626';
      } else if (variant === 'success') {
        e.currentTarget.style.backgroundColor = '#16a34a';
      }
    }
    onMouseLeave?.();
  };
  
  return (
    <button
      type={type}
      style={buttonStyles}
      disabled={disabled}
      onClick={onClick}
      data-variant={variant}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
};

export default Button; 