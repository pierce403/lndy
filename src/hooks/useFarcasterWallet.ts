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
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        console.log("🔧 useFarcasterWallet: Starting initialization");
        setIsLoading(true);
        setError(null);

        // Check if we're in a Farcaster Mini App environment
        console.log("🔧 useFarcasterWallet: Checking if in Farcaster environment");
        
        // Check for Farcaster bridge in window object
        const win = window as any;
        const hasFarcasterBridge = Boolean(win.farcaster);
        const hasMiniApp = Boolean(win.farcaster?.miniApp || win.FarcasterMiniApp);
        
        console.log("🔧 useFarcasterWallet: hasFarcasterBridge =", hasFarcasterBridge);
        console.log("🔧 useFarcasterWallet: hasMiniApp =", hasMiniApp);
        
        if (!hasFarcasterBridge && !hasMiniApp) {
          console.log("Not in Farcaster environment, skipping embedded wallet");
          setIsLoading(false);
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
          setIsLoading(false);
          return;
        }
        
        if (!provider) {
          console.log("No Ethereum provider available");
          setIsLoading(false);
          return;
        }

        // Get user info from context
        console.log("🔍 SDK context:", sdk.context);
        let user;
        try {
          user = sdk.context.user;
          console.log("👤 User context:", user, typeof user);
        } catch (err) {
          console.error("❌ Error accessing user context:", err);
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
          accounts = await provider.request({ method: 'eth_accounts' });
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
          farcasterWallet = {
            address: String(accounts[0] || ''),
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
  };

  return {
    wallet,
    isLoading,
    error,
    connect,
    disconnect,
    isConnected: !!wallet,
    isDisabled,
  };
};
