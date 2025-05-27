import { ThirdwebProvider, ConnectWallet } from "@thirdweb-dev/react";
import { Sepolia } from "@thirdweb-dev/chains";
import { useState } from "react";
import "./App.css";

import CreateLoan from "./components/CreateLoan";
import LoanList from "./components/LoanList";
import Dashboard from "./components/Dashboard";

function App() {
  const [activeTab, setActiveTab] = useState<"browse" | "create" | "dashboard">("browse");

  return (
    <ThirdwebProvider activeChain={Sepolia} clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID || ""}>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">LNDY</h1>
              <ConnectWallet />
            </div>
            <p className="mt-2 text-sm text-gray-600">Social lending powered by blockchain</p>
          </div>
        </header>

        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <button
                className={`px-3 py-4 text-sm font-medium ${
                  activeTab === "browse"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("browse")}
              >
                Browse Loans
              </button>
              <button
                className={`px-3 py-4 text-sm font-medium ${
                  activeTab === "create"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("create")}
              >
                Create Loan
              </button>
              <button
                className={`px-3 py-4 text-sm font-medium ${
                  activeTab === "dashboard"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
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

        <footer className="bg-white shadow-inner mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-gray-500">
              LNDY - Social Lending Platform © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    </ThirdwebProvider>
  );
}

export default App;
