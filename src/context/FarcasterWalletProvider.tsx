import type { ReactNode } from "react";

import { useFarcasterWallet } from "../hooks/useFarcasterWallet";
import { FarcasterWalletContext } from "./farcasterWalletContext";

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
