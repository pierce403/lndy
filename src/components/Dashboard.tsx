import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import LoanCard from "./LoanCard";
import InvestmentCard from "./InvestmentCard";
import { useLoans } from "../hooks/useLoans";
import { useInvestments } from "../hooks/useInvestments";

const Dashboard = () => {
  const account = useActiveAccount();
  const address = account?.address;
  const { loans, isLoading } = useLoans();
  const { investments: myInvestments, isLoading: investmentsLoading } = useInvestments();
  const [activeTab, setActiveTab] = useState<"created" | "invested">("created");
  
  const myLoans = loans.filter(loan => 
    loan.borrower.toLowerCase() === address?.toLowerCase()
  );
  
  const isPageLoading = isLoading || investmentsLoading;

  const handleClaimSuccess = () => {
    // Refresh the investments data after successful claim
    setTimeout(() => {
      window.location.reload(); // Simple refresh to update all data
    }, 2000);
  };

  if (!address) {
    return (
      <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-300 mb-4">Please connect your wallet to view your dashboard</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">My Dashboard</h2>
      
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "created"
                  ? "border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
              onClick={() => setActiveTab("created")}
            >
              Loans I Created ({myLoans.length})
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "invested"
                  ? "border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
              onClick={() => setActiveTab("invested")}
            >
              My Investments ({myInvestments.length} NFTs)
            </button>
          </nav>
        </div>
      </div>
      
      {isPageLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 dark:border-indigo-400"></div>
        </div>
      ) : activeTab === "created" ? (
        myLoans.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-300">You haven't created any loans yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myLoans.map((loan) => (
              <LoanCard key={loan.address} loan={loan} />
            ))}
          </div>
        )
      ) : (
        myInvestments.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-300 mb-4">You haven't invested in any loans yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fund loans to receive NFTs representing your investments
            </p>
          </div>
        ) : (
          <div>
            {/* Summary Stats */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {myInvestments.length}
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200">Total NFTs</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${myInvestments.reduce((sum, inv) => sum + inv.claimableAmount, 0).toFixed(2)}
                </div>
                <div className="text-sm text-green-800 dark:text-green-200">Available to Claim</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ${myInvestments.reduce((sum, inv) => sum + inv.contributionAmount, 0).toFixed(2)}
                </div>
                <div className="text-sm text-purple-800 dark:text-purple-200">Total Invested</div>
              </div>
            </div>

            {/* Investment Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myInvestments.map((investment) => (
                <InvestmentCard 
                  key={`${investment.loanAddress}-${investment.tokenId}`} 
                  investment={investment}
                  onClaimSuccess={handleClaimSuccess}
                />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default Dashboard;
