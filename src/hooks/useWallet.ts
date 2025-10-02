import { useActiveWallet } from "thirdweb/react";
import { useFarcasterWallet } from "./useFarcasterWallet";

/**
 * Unified wallet hook that provides the active wallet from either
 * the Farcaster embedded wallet or a browser-connected wallet.
 */
export const useWallet = () => {
  const activeWallet = useActiveWallet();
  const { wallet: farcasterWallet, isConnected: isFarcasterConnected } = useFarcasterWallet();

  // Prioritize Farcaster embedded wallet if available
  if (isFarcasterConnected && farcasterWallet) {
    return {
      address: farcasterWallet.address,
      isConnected: true,
      walletType: "farcaster" as const,
      farcaster: farcasterWallet,
      browser: null,
    };
  }

  // Fall back to any browser wallet connected through Thirdweb
  if (activeWallet) {
    return {
      address: activeWallet.address,
      isConnected: true,
      walletType: "browser" as const,
      farcaster: null,
      browser: activeWallet,
    };
  }

  // No wallet connected
  return {
    address: null,
    isConnected: false,
    walletType: null,
    farcaster: null,
    browser: null,
  };
};
