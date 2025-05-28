import { ThirdwebProvider, ConnectButton } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { mainnet } from "thirdweb/chains";
import { useState } from "react";
import "./App.css";

import CreateLoan from "./components/CreateLoan";
import LoanList from "./components/LoanList";
import Dashboard from "./components/Dashboard";

function App() {
  const [activeTab, setActiveTab] = useState<"browse" | "create" | "dashboard">("browse");

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
    <ThirdwebProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">LNDY</h1>
              <ConnectButton 
                client={client}
                chain={mainnet}
              />
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Social lending powered by Ethereum</p>
          </div>
        </header>

        <nav className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <button
                className={`px-3 py-4 text-sm font-medium ${
                  activeTab === "browse"
                    ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
                onClick={() => setActiveTab("browse")}
              >
                Browse Loans
              </button>
              <button
                className={`px-3 py-4 text-sm font-medium ${
                  activeTab === "create"
                    ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
                onClick={() => setActiveTab("create")}
              >
                Create Loan
              </button>
              <button
                className={`px-3 py-4 text-sm font-medium ${
                  activeTab === "dashboard"
                    ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
                onClick={() => setActiveTab("dashboard")}
              >
                My Dashboard
              </button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === "browse" && <LoanList />}
          {activeTab === "create" && <CreateLoan />}
          {activeTab === "dashboard" && <Dashboard />}
        </main>

        <footer className="bg-white dark:bg-gray-800 shadow-inner mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              LNDY - Social Lending Platform © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    </ThirdwebProvider>
  );
}

export default App;
