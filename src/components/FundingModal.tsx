import { useState, useEffect, useMemo } from "react";
import { useWallet } from "../hooks/useWallet";
import { prepareContractCall, getContract, readContract } from "thirdweb";
import { getLoanContract } from "../lib/client";
import { client } from "../lib/client";
import { base } from "thirdweb/chains";
import Modal from "./Modal";
import { Loan } from "../types/types";
import { useTransactionExecutor } from "../hooks/useTransactionExecutor";
import { notifyLoanContributed } from "../utils/notifications";

interface FundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan;
  onSuccess: (transactionHash: string, amount: string) => void;
}

const FundingModal = ({ isOpen, onClose, loan, onSuccess }: FundingModalProps) => {
  const { address } = useWallet();
  const { executeTransaction, isPending } = useTransactionExecutor();
  
  const [fundingAmount, setFundingAmount] = useState<number>(10);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [hasApproval, setHasApproval] = useState<boolean>(false);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);
  
  // Calculate remaining amount needed
  const remainingAmount = Number(loan.loanAmount - loan.totalFunded) / 1e6;
  const fundedPercentage = loan.loanAmount > 0 ? Number((loan.totalFunded * BigInt(100)) / loan.loanAmount) : 0;
  
  // USDC contract on Base
  const usdcContract = useMemo(
    () =>
      getContract({
        client,
        chain: base,
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
      }),
    [],
  );

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      const maxAmount = Math.min(remainingAmount, usdcBalance);
      setFundingAmount(Math.min(10, maxAmount));
      setHasApproval(false);
    }
  }, [isOpen, remainingAmount, usdcBalance]);

  // Fetch USDC balance when modal opens
  useEffect(() => {
    const fetchUsdcBalance = async () => {
      if (!address || !isOpen) {
        setIsLoadingBalance(false);
        return;
      }

      try {
        setIsLoadingBalance(true);
        console.log("💰 FundingModal: Fetching USDC balance for:", address);
        
        const balance = await readContract({
          contract: usdcContract,
          method: "function balanceOf(address account) view returns (uint256)",
          params: [address],
        });
        
        const balanceInUSDC = Number(balance) / 1e6;
        console.log("✅ FundingModal: USDC balance:", balanceInUSDC, "USDC");
        setUsdcBalance(balanceInUSDC);
      } catch (error) {
        console.error("❌ FundingModal: Failed to fetch USDC balance:", error);
        setUsdcBalance(0);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchUsdcBalance();
  }, [address, isOpen, usdcContract]);

  const handlePercentageClick = (percentage: number) => {
    const maxAmount = Math.min(remainingAmount, usdcBalance);
    const amount = Math.min((maxAmount * percentage) / 100, maxAmount);
    setFundingAmount(Math.round(amount * 100) / 100); // Round to 2 decimal places
  };

  const handleApproval = async () => {
    if (!address) return;
    
    try {
      setIsApproving(true);
      console.log("🔐 FundingModal: Starting USDC approval...");
      
      const approvalAmount = BigInt(Math.ceil(fundingAmount) * 1e6); // Convert to USDC units with some buffer
      
      const approvalTransaction = prepareContractCall({
        contract: usdcContract,
        method: "function approve(address spender, uint256 amount) returns (bool)",
        params: [loan.address, approvalAmount]
      });
      
      console.log("📝 FundingModal: Approving USDC spend:", {
        spender: loan.address,
        amount: approvalAmount.toString(),
        amountUSDC: fundingAmount
      });
      
      executeTransaction(approvalTransaction, {
        onSuccess: (result) => {
          console.log("✅ FundingModal: USDC approval successful:", result.transactionHash);
          setHasApproval(true);
        },
        onError: (error) => {
          console.error("❌ FundingModal: USDC approval failed:", error);
          alert("Failed to approve USDC spending. Please try again.");
        }
      });
    } catch (error) {
      console.error("💥 FundingModal: Approval error:", error);
      alert("Failed to approve USDC spending. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleFunding = async () => {
    if (!address || !hasApproval) return;
    
    try {
      console.log("🚀 FundingModal: Starting funding transaction...");
      const fundAmount = BigInt(Math.floor(fundingAmount * 1e6)); // Convert to USDC units
      
      const loanContract = getLoanContract(loan.address);
      const transaction = prepareContractCall({
        contract: loanContract,
        method: "function supportLoan(uint256 _amount)",
        params: [fundAmount]
      });
      
      console.log("📤 FundingModal: Funding parameters:", {
        loanAddress: loan.address,
        fundAmount: fundAmount.toString(),
        fundAmountUSDC: fundingAmount
      });
      
      executeTransaction(transaction, {
        onSuccess: (result) => {
          console.log("🎉 FundingModal: Funding successful:", result.transactionHash);
          
          // Send notification for loan contribution
          if (address) {
            const contributionData = {
              loanId: loan.address,
              borrowerAddress: loan.borrower,
              contributorAddress: address,
              amount: `${fundingAmount} USDC`,
              loanTitle: loan.title || 'Untitled Loan',
            };
            
            notifyLoanContributed(contributionData).catch(error => 
              console.error("❌ FundingModal: Failed to send contribution notification:", error)
            );
          }
          
          onSuccess(result.transactionHash, `${fundingAmount} USDC`);
          onClose();
        },
        onError: (error) => {
          console.error("❌ FundingModal: Funding failed:", error);
          alert(`Failed to fund loan: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    } catch (error) {
      console.error("💥 FundingModal: Funding error:", error);
      alert("Failed to fund loan. Please try again.");
    }
  };

  const canProceed = fundingAmount > 0 && fundingAmount <= remainingAmount && fundingAmount <= usdcBalance && address;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💰 Fund This Loan">
      <div className="space-y-6">
        {/* User's USDC Balance */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-blue-800 dark:text-blue-200 font-medium">Your USDC Balance</span>
            {isLoadingBalance ? (
              <div className="flex items-center text-blue-600 dark:text-blue-400">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </div>
            ) : (
              <span className="text-xl font-bold text-blue-900 dark:text-blue-100">
                ${usdcBalance.toLocaleString()} USDC
              </span>
            )}
          </div>
          {!isLoadingBalance && usdcBalance < 1 && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              ⚠️ You need USDC to fund loans. Get USDC on Base network first.
            </p>
          )}
        </div>

        {/* Loan Progress */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-300">Funding Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">
              ${(Number(loan.totalFunded) / 1e6).toLocaleString()} / ${(Number(loan.loanAmount) / 1e6).toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
            <div 
              className="bg-indigo-600 dark:bg-indigo-500 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${fundedPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{fundedPercentage}% funded</span>
            <span>${remainingAmount.toLocaleString()} remaining</span>
          </div>
        </div>

        {/* Risk Warning */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm text-red-800 dark:text-red-200">
                <p className="font-medium">⚠️ INVESTMENT RISK WARNING</p>
                <p className="mt-1">
                  <strong>Only fund people you know personally and trust.</strong> This is not guaranteed income. 
                  The borrower may be unable or unwilling to repay due to financial hardship, changed circumstances, 
                  technical issues, or other reasons. You could lose your entire investment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Amount Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Choose funding amount (USDC)
          </label>
          
          {/* Percentage Buttons */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[10, 25, 50, 100].map(percentage => {
              const maxAmount = Math.min(remainingAmount, usdcBalance);
              const amount = Math.min((maxAmount * percentage) / 100, maxAmount);
              const isDisabled = maxAmount <= 0;
              return (
                <button
                  key={percentage}
                  onClick={() => handlePercentageClick(percentage)}
                  disabled={isDisabled}
                  className={`px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {percentage === 100 ? 'MAX' : `${percentage}%`}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ${amount.toFixed(0)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Amount Input */}
          <div className="space-y-3">
            <input
              type="number"
              min="1"
              max={Math.min(remainingAmount, usdcBalance)}
              step="0.01"
              value={fundingAmount}
              onChange={(e) => setFundingAmount(Math.min(parseFloat(e.target.value) || 0, Math.min(remainingAmount, usdcBalance)))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter custom amount"
            />
            
            {/* Validation Messages */}
            {fundingAmount > usdcBalance && (
              <p className="text-sm text-red-600 dark:text-red-400">
                ⚠️ Amount exceeds your USDC balance (${usdcBalance.toLocaleString()})
              </p>
            )}
            {fundingAmount > remainingAmount && (
              <p className="text-sm text-orange-600 dark:text-orange-400">
                ⚠️ Amount exceeds remaining needed (${remainingAmount.toLocaleString()})
              </p>
            )}
            
            {/* Slider */}
            <div className="px-2">
              <input
                type="range"
                min="1"
                max={Math.min(remainingAmount, usdcBalance)}
                step="0.01"
                value={fundingAmount}
                onChange={(e) => setFundingAmount(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>$1</span>
                <span>${Math.min(remainingAmount, usdcBalance).toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!hasApproval ? (
            <button
              onClick={handleApproval}
              disabled={!canProceed || isApproving || isPending}
              className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                (!canProceed || isApproving || isPending) ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isApproving || isPending ? "Approving USDC..." : `Approve ${fundingAmount} USDC`}
            </button>
          ) : (
            <button
              onClick={handleFunding}
              disabled={!canProceed || isPending}
              className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                (!canProceed || isPending) ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isPending ? "Funding..." : `Fund ${fundingAmount} USDC`}
            </button>
          )}
          
          <button
            onClick={onClose}
            className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p className="mb-1">ℹ️ Two transactions required:</p>
          <p>1. Approve USDC spending (one-time per loan)</p>
          <p>2. Fund the loan and receive your NFT</p>
        </div>
      </div>
    </Modal>
  );
};

export default FundingModal;

// Add slider styling
const sliderStyle = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #4f46e5;
    cursor: pointer;
    box-shadow: 0 0 2px 0 #555;
    transition: background .15s ease-in-out;
  }

  .slider::-webkit-slider-thumb:hover {
    background: #4338ca;
  }

  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #4f46e5;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 2px 0 #555;
    transition: background .15s ease-in-out;
  }

  .slider::-moz-range-thumb:hover {
    background: #4338ca;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = sliderStyle;
  document.head.appendChild(styleElement);
} 