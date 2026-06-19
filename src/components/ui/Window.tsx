import type { ReactNode } from 'react';

interface Props {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Window({ title, children, className }: Props) {
  return (
    <div className={`window ${className ?? ''}`}>
      {title && <div className="window-title">{title}</div>}
      {children}
    </div>
  );
}
