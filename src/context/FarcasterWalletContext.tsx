import { createContext, useContext, type ReactNode } from "react";
import { useFarcasterWallet } from "../hooks/useFarcasterWallet";

type FarcasterWalletContextValue = ReturnType<typeof useFarcasterWallet>;

const FarcasterWalletContext = createContext<FarcasterWalletContextValue | null>(null);

interface FarcasterWalletProviderProps {
  children: ReactNode;
}

export const FarcasterWalletProvider = ({ children }: FarcasterWalletProviderProps) => {
  const farcasterWallet = useFarcasterWallet();

  return (
    <FarcasterWalletContext.Provider value={farcasterWallet}>
      {children}
    </FarcasterWalletContext.Provider>
  );
};

export const useFarcasterWalletContext = () => useContext(FarcasterWalletContext);
