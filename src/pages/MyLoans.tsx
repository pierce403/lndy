import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { readContract } from "thirdweb";
import { getLauncherContract, getLoanContract } from "../lib/client";
import { Loan } from "../types/types";
import LoanCard from "../components/LoanCard";

const MyLoans = () => {
  const account = useActiveAccount();
  const address = account?.address;
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMyLoans = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log("🔍 MyLoans: Fetching loans for borrower:", address);

        const launcherContract = getLauncherContract();
        
        // Get borrower's loan addresses
        const borrowerLoans = await readContract({
          contract: launcherContract,
          method: "function getBorrowerLoans(address borrower) view returns (address[])",
          params: [address],
        });

        console.log("📋 MyLoans: Found loan addresses:", borrowerLoans);

        if (borrowerLoans.length === 0) {
          setLoans([]);
          setIsLoading(false);
          return;
        }

        // Fetch details for each loan
        const loanDetailsPromises = borrowerLoans.map(async (loanAddress: string) => {
          const loanContract = getLoanContract(loanAddress);
          
          const details = await readContract({
            contract: loanContract,
            method: "function getLoanDetails() view returns (uint256 _loanAmount, uint256 _thankYouAmount, uint256 _targetRepaymentDate, uint256 _fundingDeadline, string _description, string _baseImageURI, address _borrower, uint256 _totalFunded, uint256 _totalRepaidAmount, uint256 _actualRepaidAmount, bool _isActive, bool _isFullyRepaid)",
            params: [],
          });

          return {
            address: loanAddress,
            loanAmount: details[0],
            interestRate: Number(details[1]),
            duration: 0, // Not used in current implementation
            fundingDeadline: Number(details[3]),
            repaymentDate: Number(details[2]),
            description: details[4],
            imageURI: details[5],
            borrower: details[6],
            totalFunded: details[7],
            isActive: details[10],
            isRepaid: details[11],
          } as Loan;
        });

        const fetchedLoans = await Promise.all(loanDetailsPromises);
        console.log("✅ MyLoans: Fetched loan details:", fetchedLoans);
        
        // Sort loans: active first, then funding, then repaid
        const sortedLoans = fetchedLoans.sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          if (a.isRepaid && !b.isRepaid) return 1;
          if (!a.isRepaid && b.isRepaid) return -1;
          return b.fundingDeadline - a.fundingDeadline; // Most recent first
        });

        setLoans(sortedLoans);
      } catch (error) {
        console.error("❌ MyLoans: Failed to fetch loans:", error);
        setLoans([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyLoans();
  }, [address]);

  if (!address) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please connect your wallet to view your loans and manage repayments.
          </p>
        </div>
      </div>
    );
  }

  const activeLoans = loans.filter(loan => loan.isActive && !loan.isRepaid);
  const fundingLoans = loans.filter(loan => !loan.isActive && !loan.isRepaid);
  const repaidLoans = loans.filter(loan => loan.isRepaid);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Loans</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your loans and repayments
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center text-gray-600 dark:text-gray-400">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading your loans...
          </div>
        </div>
      ) : loans.length === 0 ? (
        <div className="text-center bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            No loans found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven't created any loans yet. Start by creating your first loan request.
          </p>
          <a
            href="/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Your First Loan
          </a>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Loans - Need Repayment */}
          {activeLoans.length > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mr-3">
                  Active Loans
                </h2>
                <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  Needs Repayment
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeLoans.map((loan) => (
                  <LoanCard key={loan.address} loan={loan} />
                ))}
              </div>
            </div>
          )}

          {/* Funding Loans */}
          {fundingLoans.length > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mr-3">
                  Seeking Funding
                </h2>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  In Progress
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fundingLoans.map((loan) => (
                  <LoanCard key={loan.address} loan={loan} />
                ))}
              </div>
            </div>
          )}

          {/* Repaid Loans */}
          {repaidLoans.length > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mr-3">
                  Completed Loans
                </h2>
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  Repaid
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {repaidLoans.map((loan) => (
                  <LoanCard key={loan.address} loan={loan} />
                ))}
              </div>
            </div>
          )}

          {/* Summary Statistics */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              📊 Loan Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {activeLoans.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Loans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {fundingLoans.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Seeking Funding</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {repaidLoans.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Successfully Repaid</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLoans; 