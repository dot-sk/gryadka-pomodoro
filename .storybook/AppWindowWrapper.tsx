import React, { ReactNode } from 'react';

interface AppWindowWrapperProps {
  children: ReactNode;
}

export const AppWindowWrapper = ({ children }: AppWindowWrapperProps) => {
  return (
    <div
      style={{
        width: '360px',
        height: '136px',
        border: '2px solid #e0e0e0',
        borderRadius: '8px',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      {children}
    </div>
  );
};
