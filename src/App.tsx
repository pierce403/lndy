import { ThirdwebProvider, ConnectButton } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { base } from "thirdweb/chains";
import { useState } from "react";
import "./App.css";

import CreateLoan from "./components/CreateLoan";
import LoanList from "./components/LoanList";
import Dashboard from "./components/Dashboard";
import MyLoans from "./pages/MyLoans";

function App() {
  const [activeTab, setActiveTab] = useState<"browse" | "create" | "myloans" | "dashboard">("browse");

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
                chain={base}
              />
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Social lending powered by Base</p>
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
                  activeTab === "myloans"
                    ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
                onClick={() => setActiveTab("myloans")}
              >
                My Loans
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

        {/* Alpha Warning Banner */}
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
    </ThirdwebProvider>
  );
}

export default App;
