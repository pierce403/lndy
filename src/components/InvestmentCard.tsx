import { useState } from "react";
import { useSendTransaction } from "thirdweb/react";
import { useWallet } from "../hooks/useWallet";
import { prepareContractCall } from "thirdweb";
import { getLoanContract } from "../lib/client";
import { Investment } from "../types/types";
import Modal from "./Modal";
import IpfsImage from "./IpfsImage";

interface InvestmentCardProps {
  investment: Investment;
  onClaimSuccess: () => void;
}

const InvestmentCard = ({ investment, onClaimSuccess }: InvestmentCardProps) => {
  const { address } = useWallet();
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  const [showClaimSuccessModal, setShowClaimSuccessModal] = useState<boolean>(false);
  const [claimSuccessDetails, setClaimSuccessDetails] = useState<{
    transactionHash: string;
    amountClaimed: string;
  } | null>(null);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  // Calculate return percentage earned so far
  const returnPercentage = investment.contributionAmount > 0 
    ? ((investment.claimedAmount + investment.claimableAmount) / investment.contributionAmount) * 100 
    : 0;

  // Calculate total possible return
  const totalPossibleReturn = investment.totalRepaidAmount > 0 
    ? (investment.contributionAmount * investment.totalRepaidAmount) / (investment.totalRepaidAmount - (investment.actualRepaidAmount - investment.contributionAmount))
    : investment.contributionAmount;

  // Check if user has claimed all available returns based on what's been repaid so far
  const userProportionalShare = investment.actualRepaidAmount > 0 
    ? (investment.contributionAmount * investment.actualRepaidAmount) / (investment.totalRepaidAmount > 0 ? investment.totalRepaidAmount : investment.contributionAmount)
    : 0;
  
  const hasClaimedAllAvailable = investment.claimedAmount >= userProportionalShare - 0.01; // Small tolerance for rounding

  const handleClaim = async () => {
    if (!address || investment.claimableAmount <= 0) return;
    
    try {
      console.log("🎁 InvestmentCard: Starting claim transaction...");
      
      const loanContract = getLoanContract(investment.loanAddress);
      const transaction = prepareContractCall({
        contract: loanContract,
        method: "function claimReturns(uint256 tokenId)",
        params: [BigInt(investment.tokenId)]
      });
      
      console.log("📤 InvestmentCard: Claiming for token ID:", investment.tokenId);
      
      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log("🎉 InvestmentCard: Claim successful:", result.transactionHash);
          setClaimSuccessDetails({
            transactionHash: result.transactionHash,
            amountClaimed: `${investment.claimableAmount.toFixed(2)} USDC`
          });
          setShowClaimSuccessModal(true);
          onClaimSuccess();
        },
        onError: (error) => {
          console.error("❌ InvestmentCard: Claim failed:", error);
          alert(`Failed to claim returns: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    } catch (error) {
      console.error("💥 InvestmentCard: Claim error:", error);
      alert("Failed to claim returns. Please try again.");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      {/* NFT Image */}
      {investment.loanImageURI && (
        <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-700">
          <IpfsImage
            src={investment.loanImageURI}
            alt={investment.loanDescription}
            className="w-full h-48 object-cover"
          />
        </div>
      )}
      
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
              {investment.loanDescription}
            </h3>
            <a 
              href={`https://basescan.org/address/${investment.borrower}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
            >
              By {investment.borrower.substring(0, 6)}...{investment.borrower.substring(38)}
            </a>
          </div>
          <div className="flex flex-col items-end">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              investment.isLoanRepaid 
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" 
                : investment.isLoanActive 
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" 
                  : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
            }`}>
              {investment.isLoanRepaid ? "Completed" : investment.isLoanActive ? "Active" : "Funding"}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              NFT #{investment.tokenId}
            </span>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Your Investment</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(investment.contributionAmount)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Already Claimed</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(investment.claimedAmount)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Available to Claim</span>
            <span className={`font-bold ${
              investment.claimableAmount > 0 
                ? "text-green-600 dark:text-green-400" 
                : "text-gray-900 dark:text-white"
            }`}>
              {formatCurrency(investment.claimableAmount)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Return Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {returnPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Return Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(returnPercentage, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
            Returns: {(investment.claimedAmount + investment.claimableAmount).toFixed(2)} / {totalPossibleReturn.toFixed(2)} USDC
          </div>
        </div>

        {/* NFT Collection Link */}
        <div className="mt-4 text-center">
          <a 
            href={`https://opensea.io/assets/base/${investment.loanAddress}/${investment.tokenId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors text-sm"
          >
            View NFT on OpenSea →
          </a>
        </div>
      </div>
      
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        {investment.claimableAmount > 0 ? (
          <button
            onClick={handleClaim}
            disabled={isPending || !address}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-700 ${
              (isPending || !address) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isPending ? "Claiming..." : `Claim ${formatCurrency(investment.claimableAmount)}`}
          </button>
        ) : investment.isLoanRepaid || hasClaimedAllAvailable ? (
          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
            <div className="font-medium text-green-600 dark:text-green-400">
              {investment.isLoanRepaid ? "✅ Loan Complete" : "✅ Fully Claimed"}
            </div>
            <div className="mt-1">
              {investment.isLoanRepaid ? "All returns have been claimed" : "All available returns claimed"}
            </div>
          </div>
        ) : investment.isLoanActive && investment.actualRepaidAmount > 0 ? (
          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
            <div className="font-medium text-blue-600 dark:text-blue-400">💰 Investment Active</div>
            <div className="mt-1">Returns available as loan is repaid</div>
          </div>
        ) : investment.isLoanActive ? (
          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
            <div className="font-medium text-blue-600 dark:text-blue-400">💰 Investment Active</div>
            <div className="mt-1">Waiting for borrower repayments</div>
          </div>
        ) : (
          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
            <div className="font-medium text-yellow-600 dark:text-yellow-400">⏳ Awaiting Funding</div>
            <div className="mt-1">Loan not yet active</div>
          </div>
        )}
      </div>

      {showClaimSuccessModal && (
        <Modal
          isOpen={showClaimSuccessModal}
          onClose={() => setShowClaimSuccessModal(false)}
          title="🎉 Claim Successful!"
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
                    Your investment returns have been successfully claimed!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount Claimed:</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{claimSuccessDetails?.amountClaimed}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Transaction:</p>
                <a 
                  href={`https://basescan.org/tx/${claimSuccessDetails?.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-mono text-sm break-all"
                >
                  {claimSuccessDetails?.transactionHash}
                </a>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                onClick={() => setShowClaimSuccessModal(false)}
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

export default InvestmentCard; 