import { useActiveWallet } from "thirdweb/react";
import { useFarcasterWallet } from "./useFarcasterWallet";

/**
 * Unified wallet hook that provides the active wallet from either
 * Farcaster embedded wallet or Thirdweb wallet
 */
export const useWallet = () => {
  const thirdwebWallet = useActiveWallet();
  const { wallet: farcasterWallet, isConnected: isFarcasterConnected } = useFarcasterWallet();

  // Prioritize Farcaster embedded wallet if available
  if (isFarcasterConnected && farcasterWallet) {
    return {
      address: farcasterWallet.address,
      isConnected: true,
      walletType: 'farcaster' as const,
      farcaster: farcasterWallet,
      thirdweb: null,
    };
  }

  // Fall back to Thirdweb wallet
  if (thirdwebWallet) {
    return {
      address: thirdwebWallet.address,
      isConnected: true,
      walletType: 'thirdweb' as const,
      farcaster: null,
      thirdweb: thirdwebWallet,
    };
  }

  // No wallet connected
  return {
    address: null,
    isConnected: false,
    walletType: null,
    farcaster: null,
    thirdweb: null,
  };
};
