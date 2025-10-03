import { createContext, useContext, type ReactNode } from "react";
import { useFarcasterWallet } from "../hooks/useFarcasterWallet";
import ErrorBoundary from "../components/ErrorBoundary";

type FarcasterWalletContextValue = ReturnType<typeof useFarcasterWallet>;

const FarcasterWalletContext = createContext<FarcasterWalletContextValue | null>(null);

interface FarcasterWalletProviderProps {
  children: ReactNode;
}

/**
 * Provider for Farcaster wallet context with error boundary protection
 * The useFarcasterWallet hook can throw errors during SDK initialization
 */
export const FarcasterWalletProvider = ({ children }: FarcasterWalletProviderProps) => {
  return (
    <ErrorBoundary>
      <FarcasterWalletProviderContent>
        {children}
      </FarcasterWalletProviderContent>
    </ErrorBoundary>
  );
};

/**
 * Internal provider component that uses the hook
 */
const FarcasterWalletProviderContent = ({ children }: FarcasterWalletProviderProps) => {
  const farcasterWallet = useFarcasterWallet();

  return (
    <FarcasterWalletContext.Provider value={farcasterWallet}>
      {children}
    </FarcasterWalletContext.Provider>
  );
};

export const useFarcasterWalletContext = () => useContext(FarcasterWalletContext);
