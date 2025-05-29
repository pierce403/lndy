import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { getLoanContract } from "../lib/client";
import { Loan } from "../types/types";
import { useState } from "react";
import Modal from "./Modal";

interface LoanCardProps {
  loan: Loan;
}

const LoanCard = ({ loan }: LoanCardProps) => {
  const account = useActiveAccount();
  const address = account?.address;
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  const [showFundingSuccessModal, setShowFundingSuccessModal] = useState<boolean>(false);
  const [fundingSuccessDetails, setFundingSuccessDetails] = useState<{
    transactionHash: string;
    amountFunded: string;
  } | null>(null);

  const progressPercentage = loan.loanAmount > 0 
    ? Number((loan.totalFunded * BigInt(100)) / loan.loanAmount)
    : 0;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatCurrency = (amount: bigint) => {
    return (Number(amount) / 1e6).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  // Calculate total repayment amount (principal + thank you amount)
  const calculateTotalRepayment = () => {
    const principal = Number(loan.loanAmount) / 1e6;
    const thankYouAmount = (principal * loan.interestRate) / 10000;
    return principal + thankYouAmount;
  };

  // Calculate repayment health for active loans
  const calculateRepaymentHealth = () => {
    if (!loan.isActive || loan.isRepaid) return null;
    
    const now = Math.floor(Date.now() / 1000);
    const loanStartTime = loan.fundingDeadline; // Assuming loan starts when funding ends
    const totalDuration = loan.repaymentDate - loanStartTime;
    const timeElapsed = now - loanStartTime;
    const timeProgress = Math.max(0, Math.min(100, (timeElapsed / totalDuration) * 100));
    
    // For now, assume no repayment has been made yet (repaymentProgress = 0)
    // In a real implementation, you'd track actual repayments
    const repaymentProgress = 0;
    
    // Health is good if repayment is keeping up with time
    // Yellow if behind, red if significantly behind
    let healthStatus = 'good';
    let healthColor = 'bg-green-500';
    
    if (repaymentProgress < timeProgress - 20) {
      healthStatus = 'behind';
      healthColor = 'bg-yellow-500';
    }
    if (repaymentProgress < timeProgress - 40) {
      healthStatus = 'concerning';
      healthColor = 'bg-red-500';
    }
    
    return {
      timeProgress,
      repaymentProgress,
      healthStatus,
      healthColor
    };
  };

  const repaymentHealth = calculateRepaymentHealth();

  const handleFund = async () => {
    console.log("💰 LoanCard: Fund button clicked");
    console.log("🏦 LoanCard: Loan being funded:", {
      address: loan.address,
      description: loan.description,
      borrower: loan.borrower,
      loanAmount: Number(loan.loanAmount) / 1e6 + " USDC",
      totalFunded: Number(loan.totalFunded) / 1e6 + " USDC",
      progressPercentage: progressPercentage + "%"
    });
    console.log("👤 LoanCard: Current user address:", address);
    
    if (!address) {
      console.warn("⚠️ LoanCard: No wallet connected, showing alert");
      alert("Please connect your wallet first");
      return;
    }

    try {
      console.log("🚀 LoanCard: Starting loan funding process...");
      const fundAmount = BigInt(10 * 1e6); // 10 USDC (6 decimals)
      console.log("💸 LoanCard: Funding amount:", Number(fundAmount) / 1e6, "USDC");
      
      console.log("🔗 LoanCard: Getting loan contract instance...");
      const contract = getLoanContract(loan.address);
      console.log("✅ LoanCard: Loan contract obtained:", contract);
      
      console.log("📝 LoanCard: Preparing funding transaction...");
      const transaction = prepareContractCall({
        contract,
        method: "function supportLoan(uint256 _amount)",
        params: [fundAmount]
      });
      
      console.log("🔗 LoanCard: Transaction prepared:", transaction);
      console.log("📤 LoanCard: Transaction parameters:", {
        contractAddress: loan.address,
        fundAmount: fundAmount.toString(),
        fundAmountUSDC: Number(fundAmount) / 1e6
      });
      
      console.log("🚀 LoanCard: Sending funding transaction...");
      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log("🎉 LoanCard: Funding transaction successful!");
          console.log("✅ LoanCard: Transaction result:", result);
          console.log("🔗 LoanCard: Transaction hash:", result.transactionHash);
          console.log("📊 LoanCard: Funding details:", {
            loanAddress: loan.address,
            funder: address,
            amountFunded: Number(fundAmount) / 1e6 + " USDC",
            previousFunding: Number(loan.totalFunded) / 1e6 + " USDC",
            timestamp: new Date().toISOString()
          });
          
          setShowFundingSuccessModal(true);
          setFundingSuccessDetails({
            transactionHash: result.transactionHash,
            amountFunded: Number(fundAmount) / 1e6 + " USDC"
          });
        },
        onError: (error) => {
          console.error("💥 LoanCard: Funding transaction failed!");
          console.error("❌ LoanCard: Transaction error:", error);
          console.error("🔍 LoanCard: Error details:", {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
            loanAddress: loan.address,
            fundAmount: Number(fundAmount) / 1e6 + " USDC"
          });
          alert("Failed to fund loan. See console for details.");
        }
      });
    } catch (err) {
      console.error("💥 LoanCard: Critical error in funding process!");
      console.error("❌ LoanCard: Error details:", err);
      console.error("🔍 LoanCard: Error breakdown:", {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace',
        loanAddress: loan.address,
        userAddress: address
      });
      alert("Failed to fund loan. See console for details.");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      {/* NFT Image */}
      {loan.imageURI && (
        <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-700">
          <img
            src={loan.imageURI}
            alt={loan.description}
            className="w-full h-48 object-cover"
            onError={(e) => {
              console.warn("Failed to load loan image:", loan.imageURI);
              // Show a placeholder instead of hiding completely
              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="%23f3f4f6"/><text x="200" y="100" text-anchor="middle" dy="0.3em" font-family="sans-serif" font-size="16" fill="%236b7280">Image not available</text></svg>';
            }}
          />
        </div>
      )}
      
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">{loan.description}</h3>
            <a 
              href={`https://basescan.org/address/${loan.borrower}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
            >
              By {loan.borrower.substring(0, 6)}...{loan.borrower.substring(38)}
            </a>
          </div>
          <div className={`px-2 py-1 text-xs font-medium rounded-full ${
            loan.isRepaid 
              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" 
              : loan.isActive 
                ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" 
                : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
          }`}>
            {loan.isRepaid ? "Repaid" : loan.isActive ? "Active" : "Funding"}
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Requesting</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(loan.loanAmount)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500 dark:text-gray-400">Will return</span>
            <span className="font-medium text-gray-900 dark:text-white">
              ${calculateTotalRepayment().toLocaleString()} 
              <span className="text-xs text-gray-400 ml-1">
                (includes ${((Number(loan.loanAmount) / 1e6 * loan.interestRate) / 10000).toLocaleString()} thank you)
              </span>
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500 dark:text-gray-400">Target repayment</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatDate(loan.repaymentDate)}</span>
          </div>
          {loan.isActive && !loan.isRepaid && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500 dark:text-gray-400">Funding deadline was</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatDate(loan.fundingDeadline)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500 dark:text-gray-400">NFT Collection</span>
            <a 
              href={`https://opensea.io/assets/base/${loan.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors text-xs"
            >
              View on OpenSea →
            </a>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Funding Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(loan.totalFunded)} / {formatCurrency(loan.loanAmount)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
            {progressPercentage}% funded
          </div>
        </div>

        {/* Repayment Health Indicator for Active Loans */}
        {repaymentHealth && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500 dark:text-gray-400">Repayment Health</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                repaymentHealth.healthStatus === 'good' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : repaymentHealth.healthStatus === 'behind'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {repaymentHealth.healthStatus === 'good' ? 'On Track' : 
                 repaymentHealth.healthStatus === 'behind' ? 'Behind Schedule' : 'Needs Attention'}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Time elapsed: {Math.round(repaymentHealth.timeProgress)}% • Repaid: {repaymentHealth.repaymentProgress}%
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div className="relative h-2 rounded-full">
                {/* Time progress bar */}
                <div 
                  className="absolute top-0 left-0 h-2 bg-gray-400 rounded-full" 
                  style={{ width: `${repaymentHealth.timeProgress}%` }}
                ></div>
                {/* Repayment progress bar */}
                <div 
                  className={`absolute top-0 left-0 h-2 rounded-full ${repaymentHealth.healthColor}`}
                  style={{ width: `${repaymentHealth.repaymentProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        {!loan.isActive && !loan.isRepaid && Math.floor(Date.now() / 1000) < loan.fundingDeadline ? (
          <button
            onClick={handleFund}
            disabled={isPending || !address}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-700 ${
              isPending || !address ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isPending ? "Processing..." : "Fund This Loan"}
          </button>
        ) : loan.isActive && !loan.isRepaid ? (
          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
            <div className="font-medium text-green-600 dark:text-green-400">✓ Fully funded!</div>
            <div className="mt-1">NFTs are now tradable • Repayment in progress</div>
          </div>
        ) : loan.isRepaid ? (
          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
            <div className="font-medium text-green-600 dark:text-green-400">✓ Successfully repaid!</div>
            <div className="mt-1">Thank you to all supporters</div>
          </div>
        ) : (
          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
            Funding period has ended
          </div>
        )}
      </div>

      {showFundingSuccessModal && (
        <Modal
          isOpen={showFundingSuccessModal}
          onClose={() => setShowFundingSuccessModal(false)}
          title="🎉 Funding Successful!"
        >
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Thank you for funding this loan! Your contribution has been recorded.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount Funded:</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{fundingSuccessDetails?.amountFunded}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Transaction:</p>
                <a 
                  href={`https://basescan.org/tx/${fundingSuccessDetails?.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-mono text-sm break-all"
                >
                  {fundingSuccessDetails?.transactionHash}
                </a>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                onClick={() => setShowFundingSuccessModal(false)}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LoanCard;

