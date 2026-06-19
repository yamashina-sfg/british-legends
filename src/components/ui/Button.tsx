import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  primary?: boolean;
  center?: boolean;
}

export function Button({ children, primary, center, className, ...rest }: Props) {
  return (
    <button
      className={`btn ${primary ? 'btn-primary' : ''} ${center ? 'btn-center' : ''} ${className ?? ''}`}
      {...rest}
    >
      {children}
    </button>
  );
}
