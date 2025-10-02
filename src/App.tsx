import { ThirdwebProvider, ConnectButton, useActiveWallet, useConnectModal } from "thirdweb/react";
import { createThirdwebClient, type ThirdwebClient } from "thirdweb";
import { base } from "thirdweb/chains";
import { useEffect, useMemo, useRef, useState } from "react";
import { createWallet, walletConnect } from "thirdweb/wallets";
import { sdk } from "@farcaster/miniapp-sdk";
import "./App.css";

import CreateLoan from "./components/CreateLoan";
import LoanList from "./components/LoanList";
import Dashboard from "./components/Dashboard";
import MyLoans from "./pages/MyLoans";
import About from "./components/About";
import ErrorBoundary from "./components/ErrorBoundary";
import { useIsFarcasterPreferred } from "./hooks/useIsFarcasterPreferred";
import { FarcasterWalletProvider } from "./context/FarcasterWalletContext";
import { useFarcasterWalletContext } from "./hooks/useFarcasterWalletContext";

type AppShellProps = {
  client: ThirdwebClient;
};

const AppShell = ({ client }: AppShellProps) => {
  const [activeTab, setActiveTab] = useState<"browse" | "create" | "myloans" | "dashboard" | "about">("browse");
  const activeWallet = useActiveWallet();
  const { isConnecting } = useConnectModal();
  const isFarcasterPreferred = useIsFarcasterPreferred();
  const farcasterContext = useFarcasterWalletContext();
  const farcasterWallet = farcasterContext?.wallet ?? null;
  const farcasterLoading = farcasterContext?.isLoading ?? false;
  const connectFarcaster = farcasterContext?.connect;
  const isFarcasterConnected = farcasterContext?.isConnected ?? false;
  const farcasterError = farcasterContext?.error ?? null;
  const farcasterDisabled = farcasterContext?.isDisabled ?? false;
  const hasPromptedRef = useRef(false);

  const browserWallets = useMemo(
    () => [
      createWallet("io.metamask"),
      walletConnect(),
      createWallet("com.coinbase.wallet"),
      createWallet("me.rainbow"),
    ],
    [],
  );

  // Initialize Farcaster Mini App SDK
  useEffect(() => {
    try {
      console.log("🔧 App: Initializing Farcaster SDK");
      console.log("🔧 App: SDK object:", sdk);
      console.log("🔧 App: SDK actions:", sdk.actions);
      console.log("🔧 App: SDK wallet:", sdk.wallet);
      console.log("🔧 App: SDK context:", sdk.context);
      console.log("🔧 App: Available SDK methods:", Object.keys(sdk));
      if (sdk.actions) {
        console.log("🔧 App: Available actions methods:", Object.keys(sdk.actions));
      }
      if (sdk.wallet) {
        console.log("🔧 App: Available wallet methods:", Object.keys(sdk.wallet));
      }
      
      // Signal to Farcaster that the app is ready to be displayed
      if (sdk.actions && typeof sdk.actions.ready === 'function') {
        sdk.actions.ready().then(() => {
          console.log("✅ App: Farcaster SDK ready signal sent successfully");
        }).catch((error) => {
          console.error("❌ App: Failed to signal ready to Farcaster SDK:", error);
        });
      } else {
        console.log("⚠️ App: sdk.actions.ready not available, skipping ready signal");
      }
    } catch (error) {
      console.error("❌ App: Error during SDK initialization:", error);
    }
  }, []);

  // Auto-connect Farcaster embedded wallet if in Farcaster environment
  useEffect(() => {
    if (!isFarcasterPreferred || isFarcasterConnected || farcasterLoading || hasPromptedRef.current || !connectFarcaster) {
      return;
    }

    hasPromptedRef.current = true;

    // Try to connect Farcaster embedded wallet first
    void connectFarcaster().catch((error) => {
      console.debug("Farcaster embedded wallet not available, falling back to browser wallets:", error);
    });
  }, [
    isFarcasterPreferred,
    isFarcasterConnected,
    farcasterLoading,
    connectFarcaster,
  ]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">LNDY</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Social lending powered by Ethereum</p>
            </div>
            <div className="flex flex-col items-stretch sm:items-end gap-3 w-full sm:w-auto">
              {isFarcasterConnected && farcasterWallet ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-purple-800 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-200">
                  <div className="flex items-center gap-3">
                    {farcasterWallet.pfpUrl && (
                      <img
                        src={farcasterWallet.pfpUrl}
                        alt={farcasterWallet.displayName || farcasterWallet.username}
                        className="w-10 h-10 rounded-full border border-purple-200 dark:border-purple-800"
                      />
                    )}
                    <div>
                      <p className="text-sm font-semibold">
                        {farcasterWallet.displayName || farcasterWallet.username || "Farcaster User"}
                      </p>
                      <p className="text-xs font-mono opacity-80">
                        {farcasterWallet.address?.substring(0, 6)}...{farcasterWallet.address?.substring(38)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                    Farcaster Wallet
                  </span>
                </div>
              ) : null}

              {!isFarcasterConnected && isFarcasterPreferred && !farcasterDisabled ? (
                <div className="rounded-lg border border-purple-200 bg-white px-4 py-4 shadow-sm dark:border-purple-900/60 dark:bg-purple-950/30">
                  <div className="flex flex-col gap-3 text-sm text-purple-900 dark:text-purple-100">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">Farcaster Mini App detected</p>
                        <p className="text-xs text-purple-600 dark:text-purple-300">
                          Connect with your embedded wallet for the smoothest experience.
                        </p>
                      </div>
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/60 dark:text-purple-200">
                        Recommended
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (!connectFarcaster) {
                          console.warn("Farcaster connect function unavailable");
                          return;
                        }

                        console.log("🔗 Connect Farcaster button clicked");
                        connectFarcaster().catch(console.error);
                      }}
                      disabled={farcasterLoading || !connectFarcaster}
                      className="flex items-center justify-center rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-400"
                    >
                      {farcasterLoading ? "Connecting..." : "Connect Farcaster Wallet"}
                    </button>

                    {farcasterLoading && (
                      <p className="text-xs text-purple-600 dark:text-purple-300">Initializing Farcaster wallet...</p>
                    )}
                    {farcasterError && (
                      <p className="text-xs text-red-600 dark:text-red-300">Error: {farcasterError}</p>
                    )}
                  </div>
                </div>
              ) : null}

              {(!isFarcasterPreferred || farcasterDisabled) && (
                <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Connect a browser wallet</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Supports MetaMask, WalletConnect, Coinbase Wallet, Rainbow, and more.
                      </p>
                    </div>
                    <ConnectButton
                      client={client}
                      chain={base}
                      wallets={browserWallets}
                      connectButton={{
                        label: activeWallet || isConnecting ? undefined : "Connect Wallet",
                      }}
                      connectModal={{
                        size: "wide",
                        title: "Connect a wallet",
                        titleIcon: "/lndy-favicon.svg",
                        showThirdwebBranding: false,
                      }}
                    />
                  </div>
                </div>
              )}

              {isFarcasterPreferred && !isFarcasterConnected && !farcasterLoading && !farcasterDisabled ? (
                <p className="text-xs text-purple-600 dark:text-purple-300 text-right">
                  Use your Farcaster embedded wallet for seamless access
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 sm:gap-8 py-3 sm:py-0">
            <button
              className={`px-3 py-2 sm:py-4 text-sm font-medium ${
                activeTab === "browse"
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("browse")}
            >
              Browse Loans
            </button>
            <button
              className={`px-3 py-2 sm:py-4 text-sm font-medium ${
                activeTab === "create"
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("create")}
            >
              Create Loan
            </button>
            <button
              className={`px-3 py-2 sm:py-4 text-sm font-medium ${
                activeTab === "myloans"
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("myloans")}
            >
              My Loans
            </button>
            <button
              className={`px-3 py-2 sm:py-4 text-sm font-medium ${
                activeTab === "dashboard"
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("dashboard")}
            >
              My Dashboard
            </button>
            <button
              className={`px-3 py-2 sm:py-4 text-sm font-medium ${
                activeTab === "about"
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
              onClick={() => setActiveTab("about")}
            >
              About
            </button>
          </div>
        </div>
      </nav>

      {/* Alpha Warning Banner */}
      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm text-red-800 dark:text-red-200">
                <p className="font-medium">⚠️ ALPHA SOFTWARE WARNING</p>
                <p className="mt-1">
                  This is experimental software in early development. <strong>Only invest money you can afford to lose completely.</strong>
                  Only fund loans from people you know personally and trust. Borrowers may be unable or unwilling to repay for various reasons including financial hardship, technical issues, or fraud.
                  Smart contracts may contain bugs. Use at your own risk.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "browse" && <LoanList />}
        {activeTab === "create" && <CreateLoan />}
        {activeTab === "myloans" && <MyLoans />}
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "about" && <About />}
      </main>

      <footer className="bg-white dark:bg-gray-800 shadow-inner mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              LNDY - Social Lending Platform © {new Date().getFullYear()}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Alpha software. High risk. Only lend to people you know personally. Not financial advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

function App() {
  // Check if required environment variables are set
  const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Configuration Error</h2>
          <p className="text-gray-700 mb-4">
            Missing Thirdweb Client ID. Please set VITE_THIRDWEB_CLIENT_ID in your environment variables.
          </p>
          <p className="text-sm text-gray-500">
            Get your client ID from <a href="https://thirdweb.com/dashboard" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Thirdweb Dashboard</a>
          </p>
        </div>
      </div>
    );
  }

  const client = createThirdwebClient({
    clientId: clientId,
  });

  return (
    <ErrorBoundary>
      <ThirdwebProvider>
        <FarcasterWalletProvider>
          <AppShell client={client} />
        </FarcasterWalletProvider>
      </ThirdwebProvider>
    </ErrorBoundary>
  );
}

export default App;
