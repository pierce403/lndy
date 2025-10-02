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

        // Get the Ethereum provider from Farcaster
        const provider = await sdk.wallet.getEthereumProvider();
        if (!provider) {
          console.log("No Ethereum provider available");
          setIsLoading(false);
          return;
        }

        // Get user info from context
        console.log("🔍 SDK context:", sdk.context);
        const user = sdk.context.user;
        if (!user) {
          console.log("No user context available");
          setIsLoading(false);
          return;
        }
        console.log("👤 User context:", user);
        
        // Get the first account from the provider
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) {
          console.log("No accounts available");
          setIsLoading(false);
          return;
        }

        const farcasterWallet: FarcasterWallet = {
          address: accounts[0],
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

      // Get the Ethereum provider from Farcaster
      const provider = await sdk.wallet.getEthereumProvider();
      if (!provider) {
        throw new Error("Ethereum provider not available");
      }

      // Request accounts from the provider
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts available");
      }

      // Get user info from context
      const user = sdk.context.user;
      if (!user) {
        throw new Error("No user context available");
      }
      
      const farcasterWallet: FarcasterWallet = {
        address: accounts[0],
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
