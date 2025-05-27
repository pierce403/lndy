import { useState } from "react";
import { useAddress } from "@thirdweb-dev/react";
import LoanCard from "./LoanCard";
import { useLoans } from "../hooks/useLoans";
import { useInvestments } from "../hooks/useInvestments";

const Dashboard = () => {
  const address = useAddress();
  const { loans, isLoading } = useLoans();
  const [activeTab, setActiveTab] = useState<"created" | "invested">("created");
  
  const myLoans = loans.filter(loan => 
    loan.borrower.toLowerCase() === address?.toLowerCase()
  );
  
  // Use the useInvestments hook to get the user's investments
  const { investments: myInvestments, isLoading: investmentsLoading } = useInvestments();
  
  const isPageLoading = isLoading || investmentsLoading;

  if (!address) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-4">Please connect your wallet to view your dashboard</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Dashboard</h2>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "created"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("created")}
            >
              Loans I Created
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "invested"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("invested")}
            >
              My Investments
            </button>
          </nav>
        </div>
      </div>
      
      {isPageLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : activeTab === "created" ? (
        myLoans.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">You haven't created any loans yet</p>
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
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">You haven't invested in any loans yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myInvestments.map((loan) => (
              <LoanCard key={loan.address} loan={loan} />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Dashboard;
