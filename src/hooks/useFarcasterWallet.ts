import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import type { EIP1193Provider } from "viem";

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
  const [isDisabled, setIsDisabled] = useState(false);
  const [provider, setProvider] = useState<EIP1193Provider | null>(null);

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        console.log("🔧 useFarcasterWallet: Starting initialization");
        setIsLoading(true);
        setError(null);

        // Check if SDK is available before calling methods
        if (!sdk || typeof sdk.isInMiniApp !== 'function') {
          console.log("SDK not available, disabling embedded wallet");
          setIsDisabled(true);
          setIsLoading(false);
          setProvider(null);
          return;
        }

        // Check if we're in a Farcaster Mini App environment
        console.log("🔧 useFarcasterWallet: Checking if in Farcaster environment");

        let isMiniApp = false;
        try {
          // Add timeout and better error handling
          const isMiniAppPromise = sdk.isInMiniApp();
          if (isMiniAppPromise && typeof isMiniAppPromise.then === 'function') {
            // It's a promise, wait for it
            isMiniApp = await isMiniAppPromise;
          } else {
            // It's synchronous, use directly
            isMiniApp = isMiniAppPromise;
          }
        } catch (err) {
          console.warn("⚠️ useFarcasterWallet: sdk.isInMiniApp threw", err);
          // If isInMiniApp fails, assume we're not in a MiniApp
          isMiniApp = false;
        }

        console.log("🔧 useFarcasterWallet: isMiniApp =", isMiniApp);

        if (!isMiniApp) {
          console.log("Not in Farcaster environment, disabling embedded wallet");
          setIsDisabled(true);
          setIsLoading(false);
          setProvider(null);
          return;
        }

        // Get the Ethereum provider from Farcaster
        console.log("🔧 useFarcasterWallet: Getting Ethereum provider");
        let provider;
        try {
          provider = await sdk.wallet.getEthereumProvider();
          console.log("🔧 useFarcasterWallet: Provider =", provider, typeof provider);
        } catch (err) {
          console.error("❌ Error getting provider:", err);
          setIsDisabled(true);
          setIsLoading(false);
          setProvider(null);
          return;
        }

        if (!provider) {
          console.log("No Ethereum provider available");
          setIsDisabled(true);
          setIsLoading(false);
          setProvider(null);
          return;
        }

        setProvider(provider as EIP1193Provider);

        // Get user info from context
        console.log("🔍 SDK context promise detected");
        let user;
        try {
          const context = await sdk.context;
          user = context?.user;
          console.log("👤 User context:", user, typeof user);
        } catch (err) {
          console.error("❌ Error resolving user context:", err);
          setIsLoading(false);
          return;
        }

        if (!user) {
          console.log("No user context available");
          setIsLoading(false);
          return;
        }
        
        console.log("👤 User fid:", user.fid, typeof user.fid);
        console.log("👤 User username:", user.username, typeof user.username);
        console.log("👤 User displayName:", user.displayName, typeof user.displayName);
        console.log("👤 User pfpUrl:", user.pfpUrl, typeof user.pfpUrl);
        
        // Get the first account from the provider
        console.log("🔧 useFarcasterWallet: Requesting accounts");
        let accounts;
        try {
          accounts = await provider.request({ method: 'eth_accounts', params: [] });
          console.log("🔧 useFarcasterWallet: Accounts =", accounts, typeof accounts);
        } catch (err) {
          console.error("❌ Error requesting accounts:", err);
          setIsLoading(false);
          return;
        }

        if (!accounts || accounts.length === 0) {
          console.log("No accounts available");
          setIsLoading(false);
          return;
        }

        console.log("🔧 useFarcasterWallet: Creating wallet object");
        let farcasterWallet: FarcasterWallet;
        try {
          const address = String(accounts[0] || '');
          farcasterWallet = {
            address,
            fid: typeof user.fid === 'number' ? user.fid : parseInt(String(user.fid || 0)),
            username: typeof user.username === 'string' ? user.username : String(user.username || ''),
            displayName: typeof user.displayName === 'string' ? user.displayName : String(user.displayName || ''),
            pfpUrl: typeof user.pfpUrl === 'string' ? user.pfpUrl : String(user.pfpUrl || ''),
          };
          console.log("✅ Farcaster embedded wallet created:", farcasterWallet);
        } catch (err) {
          console.error("❌ Error creating wallet object:", err);
          setIsLoading(false);
          return;
        }

        setWallet(farcasterWallet);
      } catch (err) {
        console.error("❌ Failed to initialize Farcaster embedded wallet:", err);
        setError(err instanceof Error ? err.message : "Failed to connect wallet");
        setIsDisabled(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Only initialize if not disabled
    if (!isDisabled) {
      initializeWallet();
    }
  }, [isDisabled]);

  const connect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get the Ethereum provider from Farcaster
      const provider = await sdk.wallet.getEthereumProvider();
      if (!provider) {
        throw new Error("Ethereum provider not available");
      }

      setProvider(provider as EIP1193Provider);

      // Request accounts from the provider
      const accounts = await provider.request({ method: 'eth_requestAccounts', params: [] });
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts available");
      }

      // Get user info from context
      const context = await sdk.context;
      const user = context?.user;
      if (!user) {
        throw new Error("No user context available");
      }

      const farcasterWallet: FarcasterWallet = {
        address: String(accounts[0] || ''),
        fid: typeof user.fid === 'number' ? user.fid : parseInt(String(user.fid || 0)),
        username: typeof user.username === 'string' ? user.username : String(user.username || ''),
        displayName: typeof user.displayName === 'string' ? user.displayName : String(user.displayName || ''),
        pfpUrl: typeof user.pfpUrl === 'string' ? user.pfpUrl : String(user.pfpUrl || ''),
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
    setProvider(null);
  };

  return {
    wallet,
    isLoading,
    error,
    connect,
    disconnect,
    isConnected: !!wallet,
    isDisabled,
    provider,
  };
};

export type FarcasterWalletContextValue = ReturnType<typeof useFarcasterWallet>;
