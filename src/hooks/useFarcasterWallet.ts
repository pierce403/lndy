import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

interface FarcasterWallet {
  address: string;
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

/**
 * Hook to manage Farcaster embedded wallet authentication
 * This uses the native Farcaster Mini App SDK instead of Thirdweb's "Sign in with Farcaster"
 */
export const useFarcasterWallet = () => {
  const [wallet, setWallet] = useState<FarcasterWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if we're in a Farcaster Mini App environment
        const isInFarcaster = await sdk.actions.isInFarcaster();
        if (!isInFarcaster) {
          console.log("Not in Farcaster environment, skipping embedded wallet");
          setIsLoading(false);
          return;
        }

        // Get the embedded wallet
        const embeddedWallet = await sdk.actions.getEmbeddedWallet();
        if (!embeddedWallet) {
          console.log("No embedded wallet available");
          setIsLoading(false);
          return;
        }

        // Get user info
        const user = await sdk.actions.getUser();
        
        const farcasterWallet: FarcasterWallet = {
          address: embeddedWallet.address,
          fid: user.fid,
          username: user.username,
          displayName: user.displayName,
          pfpUrl: user.pfpUrl,
        };

        console.log("✅ Farcaster embedded wallet connected:", farcasterWallet);
        setWallet(farcasterWallet);
      } catch (err) {
        console.error("❌ Failed to initialize Farcaster embedded wallet:", err);
        setError(err instanceof Error ? err.message : "Failed to connect wallet");
      } finally {
        setIsLoading(false);
      }
    };

    initializeWallet();
  }, []);

  const connect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Request embedded wallet if not already available
      const embeddedWallet = await sdk.actions.getEmbeddedWallet();
      if (!embeddedWallet) {
        throw new Error("Embedded wallet not available");
      }

      // Get user info
      const user = await sdk.actions.getUser();
      
      const farcasterWallet: FarcasterWallet = {
        address: embeddedWallet.address,
        fid: user.fid,
        username: user.username,
        displayName: user.displayName,
        pfpUrl: user.pfpUrl,
      };

      setWallet(farcasterWallet);
      console.log("✅ Farcaster embedded wallet connected:", farcasterWallet);
    } catch (err) {
      console.error("❌ Failed to connect Farcaster embedded wallet:", err);
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setWallet(null);
    setError(null);
  };

  return {
    wallet,
    isLoading,
    error,
    connect,
    disconnect,
    isConnected: !!wallet,
  };
};
