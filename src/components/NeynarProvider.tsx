import React from 'react';
import { MiniAppProvider } from '@neynar/react';

interface NeynarProviderProps {
  children: React.ReactNode;
}

/**
 * Wrapper component for Neynar SDK to isolate any errors
 * This helps prevent Neynar SDK errors from crashing the entire app
 */
const NeynarProvider: React.FC<NeynarProviderProps> = ({ children }) => {
  return (
    <MiniAppProvider>
      {children}
    </MiniAppProvider>
  );
};

export default NeynarProvider;
